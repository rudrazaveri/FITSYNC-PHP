<?php
/**
 * FitSync AI — API: Coach Chat & Direct Messaging (Workflow B)
 *
 * Persists messages to central conversations and messages tables.
 * Enables live bidirectional chat between User and Assigned Trainer.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$service = FitSyncDataService::getInstance();
$db = $service->getDb();

$method = $_SERVER['REQUEST_METHOD'];

// GET: Retrieve conversation messages
if ($method === 'GET') {
    $currentUserId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : (isset($_GET['viewer_id']) ? (int)$_GET['viewer_id'] : 0);
    if (!$currentUserId) {
        $currentUserId = getActiveMemberUserId();
    }

    $withUserId = isset($_GET['with_user']) ? (int)$_GET['with_user'] : (isset($_GET['coach_id']) ? (int)$_GET['coach_id'] : 0);
    if (!$withUserId) {
        $aStmt = $db ? $db->prepare("SELECT trainer_user_id FROM trainer_assignments WHERE user_id = :uid AND status = 'active' LIMIT 1") : null;
        if ($aStmt) {
            $aStmt->execute([':uid' => $currentUserId]);
            $withUserId = (int)$aStmt->fetchColumn();
        }
        if (!$withUserId) {
            $withUserId = 1; // Default to primary coach (Kabir Khan)
        }
    }
    $conversationId = isset($_GET['conversation_id']) ? (int)$_GET['conversation_id'] : null;

    if (!$currentUserId && !$withUserId && !$conversationId) {
        echo json_encode([
            'success'         => true,
            'conversation_id' => 0,
            'messages'        => []
        ]);
        exit;
    }

    try {
        if ($conversationId === null) {
            // Verify both users exist in users table
            $chk1 = $db ? $db->query("SELECT id FROM users WHERE id = " . (int)$currentUserId)->fetchColumn() : false;
            $chk2 = $db ? $db->query("SELECT id FROM users WHERE id = " . (int)$withUserId)->fetchColumn() : false;

            if (!$chk1 || !$chk2) {
                echo json_encode([
                    'success'         => true,
                    'conversation_id' => 0,
                    'messages'        => []
                ]);
                exit;
            }

            $conversationId = $service->getOrCreateConversation($currentUserId, $withUserId);
        }

        $messages = $service->getConversationMessages($conversationId, $currentUserId);

        echo json_encode([
            'success'         => true,
            'conversation_id' => $conversationId,
            'messages'        => $messages
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// POST: Send new message
if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?: $_POST;

    $senderId    = isset($input['sender_id']) ? (int)$input['sender_id'] : (isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0);
    if (!$senderId) {
        $senderId = getActiveMemberUserId();
    }

    $recipientId = isset($input['recipient_id']) ? (int)$input['recipient_id'] : (isset($input['receiver_id']) ? (int)$input['receiver_id'] : 0);
    if (!$recipientId) {
        if ($senderId === 1) {
            $recipientId = 2; // Trainer replying to member
        } else {
            $aStmt = $db ? $db->prepare("SELECT trainer_user_id FROM trainer_assignments WHERE user_id = :uid AND status = 'active' LIMIT 1") : null;
            if ($aStmt) {
                $aStmt->execute([':uid' => $senderId]);
                $recipientId = (int)$aStmt->fetchColumn();
            }
            if (!$recipientId) $recipientId = 1;
        }
    }
    $messageText = trim((string)($input['message_text'] ?? ($input['text'] ?? ($input['message'] ?? ''))));

    if (empty($messageText)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Message text cannot be empty.']);
        exit;
    }

    if (!$senderId || !$recipientId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Both sender_id and recipient_id are required.']);
        exit;
    }

    // Verify sender and recipient exist
    $chkSender = $db ? $db->query("SELECT id FROM users WHERE id = " . (int)$senderId)->fetchColumn() : false;
    $chkRecipient = $db ? $db->query("SELECT id FROM users WHERE id = " . (int)$recipientId)->fetchColumn() : false;

    if (!$chkSender || !$chkRecipient) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Sender or recipient does not exist in users directory.']);
        exit;
    }

    try {
        $result = $service->sendMessage($senderId, $recipientId, $messageText);
        echo json_encode([
            'success' => true,
            'data'    => $result
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
