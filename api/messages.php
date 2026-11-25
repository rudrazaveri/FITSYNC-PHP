<?php
/**
 * FitSync AI — API: Two-Way Real-Time Coach Chat & Direct Messaging (Workflow B)
 *
 * Strictly enforces session identity and conversation/assignment authorization.
 * Supports incremental polling (?after_id=), unread counts, and read receipts.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['user', 'trainer', 'gym_owner', 'admin']);
$currentUserId = (int)$authUser['id'];

$service = FitSyncDataService::getInstance();
$db = $service->getDb();
if (!$db) {
    apiResponse(false, 'Database connection unavailable.', null, 500);
}

$method = $_SERVER['REQUEST_METHOD'];

// GET: Retrieve conversation messages & unread counts
if ($method === 'GET') {
    $withUserId     = isset($_GET['with_user']) ? (int)$_GET['with_user'] : (isset($_GET['coach_id']) ? (int)$_GET['coach_id'] : 0);
    $conversationId = isset($_GET['conversation_id']) ? (int)$_GET['conversation_id'] : 0;
    $afterId        = isset($_GET['after_id']) ? max(0, (int)$_GET['after_id']) : 0;

    // For a member/user who didn't pass with_user, resolve their active assigned trainer
    if ($conversationId <= 0 && $withUserId <= 0 && $authUser['role'] === 'user') {
        $aStmt = $db->prepare("SELECT trainer_user_id FROM trainer_assignments WHERE user_id = :uid AND status = 'active' LIMIT 1");
        $aStmt->execute([':uid' => $currentUserId]);
        $withUserId = (int)$aStmt->fetchColumn();
    }

    if ($conversationId <= 0 && $withUserId <= 0) {
        jsonResponse([
            'success'         => true,
            'message'         => 'No active conversation partner assigned.',
            'conversation_id' => 0,
            'unread_total'    => $service->getUnreadMessagesCount($currentUserId),
            'messages'        => [],
            'data'            => ['conversation_id' => 0, 'messages' => [], 'unread_total' => $service->getUnreadMessagesCount($currentUserId)]
        ]);
    }

    try {
        if ($conversationId > 0) {
            $conv = $service->assertConversationParticipant($conversationId, $currentUserId);
            if (($authUser['role'] ?? '') !== 'admin') {
                $service->assertCanMessage((int)$conv['participant_one_id'], (int)$conv['participant_two_id']);
            }
        } else {
            $conversationId = $service->getOrCreateConversation($currentUserId, $withUserId);
        }

        $messages = $service->getConversationMessages($conversationId, $currentUserId, $afterId);
        $unreadTotal = $service->getUnreadMessagesCount($currentUserId);

        jsonResponse([
            'success'         => true,
            'message'         => 'Messages loaded.',
            'conversation_id' => $conversationId,
            'unread_total'    => $unreadTotal,
            'messages'        => $messages,
            'data' => [
                'conversation_id' => $conversationId,
                'unread_total'    => $unreadTotal,
                'messages'        => $messages
            ]
        ]);
    } catch (RuntimeException $e) {
        apiResponse(false, $e->getMessage(), null, 403);
    } catch (Throwable $e) {
        error_log('[FitSync messages.php GET] ' . $e->getMessage());
        apiResponse(false, 'Unable to load conversation messages.', null, 500);
    }
}

// POST: Send new message strictly from authenticated session user
if ($method === 'POST') {
    requireCsrfToken();

    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?: $_POST;

    $senderId = $currentUserId; // Never trust sender_id from client!

    $recipientId = isset($input['recipient_id'])
        ? (int)$input['recipient_id']
        : (isset($input['receiver_id'])
            ? (int)$input['receiver_id']
            : (isset($input['with_user']) ? (int)$input['with_user'] : 0));
    if ($recipientId <= 0 && $authUser['role'] === 'user') {
        $aStmt = $db->prepare("SELECT trainer_user_id FROM trainer_assignments WHERE user_id = :uid AND status = 'active' LIMIT 1");
        $aStmt->execute([':uid' => $senderId]);
        $recipientId = (int)$aStmt->fetchColumn();
    }

    $messageText = trim((string)($input['message_text'] ?? ($input['text'] ?? ($input['message'] ?? ''))));

    if (empty($messageText)) {
        apiResponse(false, 'Message text cannot be empty.', null, 400);
    }

    if ($recipientId <= 0) {
        apiResponse(false, 'No assigned trainer or valid recipient found.', null, 400);
    }

    try {
        $result = $service->sendMessage($senderId, $recipientId, $messageText);
        apiResponse(true, 'Message sent.', $result);
    } catch (RuntimeException $e) {
        apiResponse(false, $e->getMessage(), null, 403);
    } catch (InvalidArgumentException $e) {
        apiResponse(false, $e->getMessage(), null, 400);
    } catch (Throwable $e) {
        error_log('[FitSync messages.php POST] ' . $e->getMessage());
        apiResponse(false, 'Unable to send message.', null, 500);
    }
}

apiResponse(false, 'Method not allowed', null, 405);
