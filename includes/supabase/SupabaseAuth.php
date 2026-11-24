<?php
/**
 * FitSync AI — Supabase Auth Wrapper (GoTrue)
 */

declare(strict_types=1);

class SupabaseAuth {
    private string $baseUrl;
    private string $apiKey;

    public function __construct(string $baseUrl, string $apiKey) {
        $this->baseUrl = $baseUrl;
        $this->apiKey = $apiKey;
    }

    public function signInWithPassword(string $email, string $password): array {
        $url = $this->baseUrl . '/auth/v1/token?grant_type=password';
        return $this->request('POST', $url, [
            'email'    => $email,
            'password' => $password
        ]);
    }

    public function signUp(string $email, string $password, array $data = []): array {
        $url = $this->baseUrl . '/auth/v1/signup';
        return $this->request('POST', $url, [
            'email'    => $email,
            'password' => $password,
            'data'     => $data
        ]);
    }

    public function getUser(string $jwtToken): array {
        $url = $this->baseUrl . '/auth/v1/user';
        return $this->request('GET', $url, [], $jwtToken);
    }

    private function request(string $method, string $url, array $payload = [], ?string $bearerToken = null): array {
        $headers = [
            'apikey: ' . $this->apiKey,
            'Authorization: Bearer ' . ($bearerToken ?? $this->apiKey),
            'Content-Type: application/json'
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

        if (!empty($payload)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $decoded = json_decode((string)$response, true);
        if ($httpCode >= 400) {
            throw new RuntimeException("Supabase Auth Error [HTTP $httpCode]: " . ($decoded['msg'] ?? $decoded['error_description'] ?? $response));
        }

        return is_array($decoded) ? $decoded : [];
    }
}
