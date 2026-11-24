<?php
/**
 * Test Bidirectional Chat between Member (ID 2) and Coach (ID 1)
 */
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../includes/FitSyncDataService.php';

$service = FitSyncDataService::getInstance();

echo "1. Member (2) sends message to Coach (1)...\n";
$msg1 = $service->sendMessage(2, 1, "Coach, what should my rest intervals be for bench press?");
print_r($msg1);

echo "\n2. Coach (1) sends reply to Member (2)...\n";
$msg2 = $service->sendMessage(1, 2, "Keep it between 2 to 3 minutes for heavy compound sets, Sneha.");
print_r($msg2);

echo "\n3. Retrieving conversation messages from Member's view...\n";
$convId = $service->getOrCreateConversation(2, 1);
$memberView = $service->getConversationMessages($convId, 2);
echo "Total messages: " . count($memberView) . "\n";
foreach ($memberView as $m) {
    echo "  [{$m['sender_name']}]: {$m['message_text']} ({$m['sent_at']})\n";
}

echo "\n4. Retrieving conversation messages from Coach's view...\n";
$coachView = $service->getConversationMessages($convId, 1);
echo "Total messages: " . count($coachView) . "\n";
foreach ($coachView as $m) {
    echo "  [{$m['sender_name']}]: {$m['message_text']} ({$m['sent_at']})\n";
}
