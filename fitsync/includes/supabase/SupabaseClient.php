<?php
/**
 * FitSync AI — Supabase Client Wrapper
 *
 * Provides authenticated connection to Supabase PostgreSQL via PostgREST and GoTrue.
 * Adheres to Supabase API specifications.
 */

declare(strict_types=1);

require_once __DIR__ . '/SupabaseDatabase.php';
require_once __DIR__ . '/SupabaseAuth.php';

class SupabaseClient {
    private string $url;
    private string $key;
    private SupabaseDatabase $database;
    private SupabaseAuth $auth;

    public function __construct(?string $url = null, ?string $key = null) {
        $this->url = rtrim($url ?? getenv('SUPABASE_URL') ?: ($_ENV['SUPABASE_URL'] ?? 'https://fitsync.supabase.co'), '/');
        $this->key = $key ?? getenv('SUPABASE_ANON_KEY') ?: ($_ENV['SUPABASE_ANON_KEY'] ?? '');

        $this->database = new SupabaseDatabase($this->url, $this->key);
        $this->auth = new SupabaseAuth($this->url, $this->key);
    }

    public function from(string $table): SupabaseQueryBuilder {
        return $this->database->from($table);
    }

    public function auth(): SupabaseAuth {
        return $this->auth;
    }

    public function getUrl(): string {
        return $this->url;
    }

    public function isConfigured(): bool {
        return !empty($this->key) && strpos($this->url, 'xxxxxxxx') === false;
    }
}
