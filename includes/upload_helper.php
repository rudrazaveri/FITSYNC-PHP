<?php
/**
 * FitSync AI — Secure File Upload & Registry Helper
 * Validates MIME type (via finfo), extension, and byte limits before moving
 * uploaded files and registering metadata in the `files` table.
 */

declare(strict_types=1);

function fitSyncStoreUploadedFile(
    PDO $db,
    array $fileEntry,
    string $purpose,
    ?int $ownerUserId = null,
    bool $allowPdf = false,
    bool $isPrivate = true
): ?int {
    if (empty($fileEntry) || !isset($fileEntry['error']) || (int)$fileEntry['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ((int)$fileEntry['error'] !== UPLOAD_ERR_OK) {
        throw new InvalidArgumentException('Uploaded file transfer error (code ' . (int)$fileEntry['error'] . ').');
    }

    $tmpPath = (string)($fileEntry['tmp_name'] ?? '');
    if ($tmpPath === '' || (!is_uploaded_file($tmpPath) && !is_file($tmpPath))) {
        throw new InvalidArgumentException('Invalid uploaded file payload.');
    }

    $sizeBytes = (int)($fileEntry['size'] ?? filesize($tmpPath));
    $maxBytes = 5 * 1024 * 1024; // 5 MB max
    if ($sizeBytes <= 0 || $sizeBytes > $maxBytes) {
        throw new InvalidArgumentException('Uploaded file must be between 1 byte and 5 MB.');
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $detectedMime = $finfo ? (string)finfo_file($finfo, $tmpPath) : '';
    if ($finfo) {
        finfo_close($finfo);
    }

    $allowedMimes = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];
    if ($allowPdf) {
        $allowedMimes['application/pdf'] = 'pdf';
    }

    if (!isset($allowedMimes[$detectedMime])) {
        throw new InvalidArgumentException(
            $allowPdf
                ? 'Unsupported file type. Allowed formats: JPG, PNG, WEBP, or PDF.'
                : 'Unsupported image format. Allowed formats: JPG, PNG, or WEBP.'
        );
    }

    $safeExt = $allowedMimes[$detectedMime];
    $allowedPurposes = [
        'profile_picture', 'gym_photo', 'verification_doc', 'health_report',
        'progress_photo', 'exercise_media', 'message_attachment', 'report_export', 'other'
    ];
    if (!in_array($purpose, $allowedPurposes, true)) {
        $purpose = 'other';
    }

    $subDir = date('Ym');
    $baseUploadDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'registration';
    $targetDir = $baseUploadDir . DIRECTORY_SEPARATOR . $subDir;
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    // Ensure PHP execution is blocked in upload folder for Apache
    $htaccessPath = $baseUploadDir . DIRECTORY_SEPARATOR . '.htaccess';
    if (!file_exists($htaccessPath)) {
        @file_put_contents($htaccessPath, "php_flag engine off\nOptions -ExecCGI -Indexes\n");
    }

    $randomKey = bin2hex(random_bytes(16)) . '.' . $safeExt;
    $storageKey = 'uploads/registration/' . $subDir . '/' . $randomKey;
    $destPath = $targetDir . DIRECTORY_SEPARATOR . $randomKey;

    if (is_uploaded_file($tmpPath)) {
        if (!move_uploaded_file($tmpPath, $destPath)) {
            throw new RuntimeException('Failed to store uploaded file safely.');
        }
    } else {
        if (!@copy($tmpPath, $destPath)) {
            throw new RuntimeException('Failed to copy validated file safely.');
        }
    }

    $origName = mb_substr(preg_replace('/[^a-zA-Z0-9._-]/', '_', basename((string)($fileEntry['name'] ?? $randomKey))), 0, 240);

    $stmt = $db->prepare("
        INSERT INTO files (owner_user_id, storage_key, original_name, mime_type, size_bytes, purpose, is_private, created_at)
        VALUES (:uid, :skey, :oname, :mime, :sz, :purpose, :priv, NOW())
    ");
    $stmt->execute([
        ':uid'     => $ownerUserId,
        ':skey'    => $storageKey,
        ':oname'   => $origName ?: $randomKey,
        ':mime'    => $detectedMime,
        ':sz'      => $sizeBytes,
        ':purpose' => $purpose,
        ':priv'    => $isPrivate ? 1 : 0
    ]);

    return (int)$db->lastInsertId();
}

function fitSyncResolveFileUrl(?string $storageKey, string $fallback = ''): string {
    $sk = trim((string)$storageKey);
    if ($sk === '') {
        return $fallback;
    }
    $skClean = ltrim(str_replace('\\', '/', $sk), '/');
    if (preg_match('#^(https?://|assets/|uploads/)#i', $skClean)) {
        return $skClean;
    }
    return 'uploads/' . $skClean;
}

function fitSyncUnlinkRelativeStorageKey(?string $storageKey): void {
    $sk = trim((string)$storageKey);
    if ($sk === '' || !str_starts_with(str_replace('\\', '/', $sk), 'uploads/')) {
        return;
    }
    $baseDir = realpath(dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads');
    $target = realpath(dirname(__DIR__) . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, ltrim($sk, '/')));
    if ($baseDir && $target && str_starts_with($target, $baseDir . DIRECTORY_SEPARATOR) && is_file($target)) {
        @unlink($target);
    }
}

function fitSyncDeleteStoredFile(PDO $db, ?int $fileId): void {
    if (!$fileId || $fileId <= 0) {
        return;
    }
    $st = $db->prepare("SELECT storage_key FROM files WHERE id = :fid LIMIT 1");
    $st->execute([':fid' => $fileId]);
    $sk = $st->fetchColumn();
    if ($sk) {
        fitSyncUnlinkRelativeStorageKey((string)$sk);
    }
    try {
        $db->prepare("DELETE FROM files WHERE id = :fid")->execute([':fid' => $fileId]);
    } catch (Throwable $e) {
        // Fallback if still referenced by another FK: soft-delete
        $db->prepare("UPDATE files SET deleted_at = NOW() WHERE id = :fid")->execute([':fid' => $fileId]);
    }
}
