<?php
/**
 * FitSync AI — Supabase PHP Client (PostgREST & Supabase Auth)
 * Communicates with Supabase using native PHP cURL requests.
 */

require_once __DIR__ . '/config.php';

class Supabase {
    private static $url = SUPABASE_URL;
    private static $anonKey = SUPABASE_ANON_KEY;
    private static $serviceKey = SUPABASE_SERVICE_ROLE_KEY;

    /**
     * Start a query builder on a table
     */
    public static function table($tableName) {
        return new SupabaseTableQuery($tableName, self::$url, self::$anonKey);
    }

    /**
     * Auth operations wrapper
     */
    public static function auth() {
        return new SupabaseAuth(self::$url, self::$anonKey);
    }
}

class SupabaseTableQuery {
    private $tableName;
    private $url;
    private $key;
    private $selectCols = '*';
    private $filters = [];
    private $order = '';
    private $limit = null;

    public function __construct($tableName, $url, $key) {
        $this->tableName = $tableName;
        $this->url = rtrim($url, '/');
        $this->key = $key;
    }

    public function select($columns = '*') {
        $this->selectCols = $columns;
        return $this;
    }

    public function eq($column, $value) {
        $this->filters[] = $column . '=eq.' . urlencode($value);
        return $this;
    }

    public function order($column, $ascending = true) {
        $this->order = 'order=' . $column . '.' . ($ascending ? 'asc' : 'desc');
        return $this;
    }

    public function limit($count) {
        $this->limit = 'limit=' . intval($count);
        return $this;
    }

    public function get() {
        $endpoint = $this->url . '/rest/v1/' . $this->tableName . '?select=' . urlencode($this->selectCols);
        
        if (!empty($this->filters)) {
            $endpoint .= '&' . implode('&', $this->filters);
        }
        if ($this->order) {
            $endpoint .= '&' . $this->order;
        }
        if ($this->limit) {
            $endpoint .= '&' . $this->limit;
        }

        return $this->request('GET', $endpoint);
    }

    public function insert($data) {
        $endpoint = $this->url . '/rest/v1/' . $this->tableName;
        return $this->request('POST', $endpoint, $data, [
            'Prefer: return=representation'
        ]);
    }

    public function update($data) {
        $endpoint = $this->url . '/rest/v1/' . $this->tableName;
        if (!empty($this->filters)) {
            $endpoint .= '?' . implode('&', $this->filters);
        }
        return $this->request('PATCH', $endpoint, $data, [
            'Prefer: return=representation'
        ]);
    }

    public function delete() {
        $endpoint = $this->url . '/rest/v1/' . $this->tableName;
        if (!empty($this->filters)) {
            $endpoint .= '?' . implode('&', $this->filters);
        }
        return $this->request('DELETE', $endpoint);
    }

    private function request($method, $endpoint, $body = null, $extraHeaders = []) {
        if (!function_exists('curl_init')) {
            // Fallback if cURL extension is not installed
            return ['error' => 'cURL PHP extension is required'];
        }

        $ch = curl_init();
        $headers = array_merge([
            'apikey: ' . $this->key,
            'Authorization: Bearer ' . $this->key,
            'Content-Type: application/json'
        ], $extraHeaders);

        curl_setopt($ch, CURLOPT_URL, $endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);

        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            return ['error' => $curlError, 'data' => null];
        }

        $decoded = json_decode($response, true);
        if ($httpCode >= 400) {
            return [
                'error' => $decoded['message'] ?? 'Supabase HTTP error ' . $httpCode,
                'status' => $httpCode,
                'data' => null
            ];
        }

        return ['error' => null, 'status' => $httpCode, 'data' => $decoded];
    }
}

class SupabaseAuth {
    private $url;
    private $key;

    public function __construct($url, $key) {
        $this->url = rtrim($url, '/');
        $this->key = $key;
    }

    public function signUp($email, $password, $metadata = []) {
        $endpoint = $this->url . '/auth/v1/signup';
        $body = [
            'email' => $email,
            'password' => $password,
            'data' => $metadata
        ];
        return $this->authRequest($endpoint, $body);
    }

    public function signInWithPassword($email, $password) {
        $endpoint = $this->url . '/auth/v1/token?grant_type=password';
        $body = [
            'email' => $email,
            'password' => $password
        ];
        return $this->authRequest($endpoint, $body);
    }

    private function authRequest($endpoint, $body) {
        if (!function_exists('curl_init')) {
            return ['error' => 'cURL PHP extension is not available'];
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $this->key,
            'Authorization: Bearer ' . $this->key,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 8);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            return ['error' => $err, 'data' => null];
        }

        $decoded = json_decode($response, true);
        if ($httpCode >= 400) {
            return [
                'error' => $decoded['msg'] ?? ($decoded['error_description'] ?? 'Authentication failed'),
                'data' => null
            ];
        }

        return ['error' => null, 'data' => $decoded];
    }
}
