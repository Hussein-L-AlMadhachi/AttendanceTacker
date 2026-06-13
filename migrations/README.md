# Database Migrations

Apply these files in filename order against the target PostgreSQL database.

Example:

```sh
for file in migrations/*.sql; do
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
done
```

The migrations mirror the active tables registered in `backend/src/db.ts`.

