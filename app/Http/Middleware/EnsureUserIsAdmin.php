<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $adminEmails = collect(config('app.admin_emails', []))
            ->map(fn (string $email): string => mb_strtolower($email))
            ->all();

        abort_unless(
            $user?->is_admin || in_array(mb_strtolower((string) $user?->email), $adminEmails, true),
            403,
        );

        return $next($request);
    }
}
