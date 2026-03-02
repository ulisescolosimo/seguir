# Recordatorios por email con n8n

El endpoint `POST /api/reminders/send` devuelve la lista de usuarios que deben recibir un recordatorio de escritura hoy (según su opción **Recordatorios amorosos** en perfil: 1, 2 o 3 por semana). n8n puede llamarlo con un cron y enviar un mail a cada uno.

## Variables de entorno

### En el proyecto (Vercel / .env.local)

| Variable | Descripción |
|----------|-------------|
| `CRON_REMINDERS_SECRET` | Secret que n8n enviará en el header para autorizar la llamada. Generá uno seguro (ej. `openssl rand -hex 32`) y usalo solo en el servidor y en n8n. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key del proyecto Supabase (Dashboard → Settings → API). **No exponer al cliente.** Solo para este endpoint en el servidor. |

Además de las que ya usás: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### En n8n

- La misma `CRON_REMINDERS_SECRET` para enviarla en el request (ver abajo).

## Llamada al endpoint

- **URL:** `https://tu-dominio.com/api/reminders/send`
- **Método:** `POST`
- **Headers:** uno de los dos:
  - `Authorization: Bearer <CRON_REMINDERS_SECRET>`
  - `x-api-key: <CRON_REMINDERS_SECRET>`

**Respuesta correcta (200):**

```json
{
  "users": [
    { "id": "uuid", "email": "usuario@ejemplo.com", "first_name": "María" },
    ...
  ]
}
```

Si no hay elegibles hoy, `users` es `[]`. n8n puede iterar sobre `users` y enviar un mail a cada `email` (y usar `first_name` en el cuerpo si querés).

## Flujo sugerido en n8n

1. **Cron** (Schedule Trigger): por ejemplo todos los días a las 9:00.
2. **HTTP Request**: POST a `https://tu-dominio.com/api/reminders/send`, header `Authorization: Bearer {{ $env.CRON_REMINDERS_SECRET }}`.
3. **Loop** sobre `{{ $json.users }}` (o “Split Out” del array).
4. **Send Email** (Gmail / SMTP / etc.): para cada item, enviar a `{{ $json.email }}` con un mensaje tipo “Hola {{ $json.first_name || 'autor' }}, es un buen momento para escribir.”

## Comportamiento del endpoint

- Solo incluye usuarios con `reminders_per_week` > 0.
- No incluye a quien ya recibió un recordatorio en las últimas 24 h.
- No incluye a quien ya llegó al tote de recordatorios de la semana (1, 2 o 3 según su elección).
- Para cada elegible, **inserta** la notificación in-app (`type: reminder`), así la campanita de la app también muestra el recordatorio.
- Devuelve `id`, `email` y `first_name` para que n8n envíe el mail.
