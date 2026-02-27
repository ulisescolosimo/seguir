# Plantillas de email

## Bienvenida al alumno (`welcome-student.html`)

Se usa cuando el usuario completa el registro y el webhook `seguir-mail` recibe los datos.

### Variables (reemplazar en n8n)

| Variable       | Origen en n8n     | Descripción                    |
|----------------|-------------------|--------------------------------|
| `{{first_name}}` | `$json.body.first_name` | Nombre del alumno           |
| `{{last_name}}`  | `$json.body.last_name`  | Apellido (opcional en texto) |
| `{{email}}`      | `$json.body.email`     | Email del destinatario       |
| `{{app_url}}`    | fijo o variable        | URL de la app (ej. https://tudominio.com) |

### Uso en n8n

1. **Webhook** recibe el POST con `body.email`, `body.first_name`, `body.last_name`, `body.user_id`.
2. **Nodo “Edit Template” o “Set”**: armar el HTML del correo reemplazando las variables, por ejemplo con expresiones:
   - Cuerpo HTML: leer el contenido de esta plantilla y usar `replace` para sustituir `{{first_name}}` por `{{ $json.body.first_name }}`, etc.
3. **Nodo de Email** (Gmail, SMTP, SendGrid, etc.):
   - **To**: `{{ $json.body.email }}`
   - **Subject**: `Bienvenido a Seguir, {{ $json.body.first_name }}`
   - **Body** (HTML): el HTML ya con las variables reemplazadas.

Si tu nodo de email acepta HTML directamente, podés pasar el HTML de la plantilla y en n8n usar expresiones tipo `{{ $json.body.first_name }}` en el campo de cuerpo si el nodo lo soporta.

### Asunto sugerido

```
Bienvenido a Seguir, {{first_name}}
```

O en expresión n8n: `Bienvenido a Seguir, {{ $json.body.first_name }}`
