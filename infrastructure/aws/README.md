# Guía de despliegue en AWS

Arquitectura recomendada:

```text
Route 53 → CloudFront + WAF → ALB (HTTPS/TLS)
                         ├── ECS/EKS: proyecto-juegos-web
                         └── ECS/EKS: proyecto-juegos-api
                                  └── RDS/Supabase PostgreSQL
Secrets Manager → DATABASE_URL, SUPABASE_JWT_SECRET
CloudWatch → logs y métricas de /health
```

## Checklist

- [ ] TLS con certificado en ACM y ALB/CloudFront.
- [ ] WAF con reglas managed y rate limiting.
- [ ] Secrets en AWS Secrets Manager, nunca en imágenes ni en Git.
- [ ] Logs centralizados en CloudWatch.
- [ ] Alarmas por 5xx, latencia y health check fallido.
- [ ] Backups automáticos de la base de datos.
- [ ] CORS restringido al dominio real de CloudFront.
