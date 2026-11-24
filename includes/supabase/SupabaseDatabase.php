<?php
/**
 * FitSync AI — Supabase Database Query Builder (PostgREST)
 */

declare(strict_types=1);

class SupabaseDatabase {
    private string $baseUrl;
    private string $apiKey;

    public function __construct(string $baseUrl, string $apiKey) {
        $this->baseUrl = $baseUrl;
        $this->apiKey = $apiKey;
    }

    public function from(string $table): SupabaseQueryBuilder {
        return new SupabaseQueryBuilder($this->baseUrl, $this->apiKey, $table);
    }
}

class SupabaseQueryBuilder {
    private string $baseUrl;
    private string $apiKey;
    private string $table;
    private array $queryParams = [];
    private string $method = 'GET';
    private ?array $body = null;
    private array $headers = [];

    public function __construct(string $baseUrl, string $apiKey, string $table) {
        $this->baseUrl = $baseUrl;
        $this->apiKey = $apiKey;
        $this->table = $table;

        $this->headers = [
            'apikey: ' . $this->apiKey,
            'Authorization: Bearer ' . $this->apiKey,
            'Content-Type: application/json',
            'Prefer: return=representation'
        ];
    }

    public function select(string $columns = '*'): self {
        $this->method = 'GET';
        $this->queryParams['select'] = $columns;
        return $this;
    }

    public function eq(string $column, $value): self {
        $this->queryParams[$column] = 'eq.' . $value;
        return $this;
    }

    public function order(string $column, bool $ascending = true): self {
        $this->queryParams['order'] = $column . '.' . ($ascending ? 'asc' : 'desc');
        return $this;
    }

    public function limit(int $limit): self {
        $this->queryParams['limit'] = $limit;
        return $this;
    }

    public function insert(array $data): self {
        $this->method = 'POST';
        $this->body = $data;
        return $this;
    }

    public function update(array $data): self {
        $this->method = 'PATCH';
        $this->body = $data;
        return $this;
    }

    public function delete(): self {
        $this->method = 'DELETE';
        return $this;
    }

    public function execute(): array {
        $url = $this->baseUrl . '/rest/v1/' . $this->table;
        if (!empty($this->queryParams)) {
            $url .= '?' . http_build_query($this->queryParams);
        }

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $this->headers);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $this->method);

        if ($this->body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($this->body));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $decoded = json_decode((string)$response, true);
        if ($httpCode >= 400) {
            throw new RuntimeException("Supabase PostgREST Error [HTTP $httpCode]: " . ($decoded['message'] ?? $response));
        }

        return is_array($decoded) ? $decoded : [];
    }
}
