# Yedekleme & Geri-Yükleme Runbook

Redwall prod Postgres (`redwall` DB, VDS `194.62.52.14`, Docker Swarm) için yedekleme
ve **kanıtlanmış** geri-yükleme prosedürü.

## Yedekler nerede / ne zaman
- Her deploy'da (main'e push), CI migrate ÖNCESİ otomatik `pg_dump` alınır:
  `/opt/redwall/backups/pre-migrate-YYYYMMDD-HHMMSS.sql.gz` (gzip, plain SQL dump).
- Son **10** yedek tutulur (eskiler CI temizlik adımı + günlük cron ile silinir).
- Mekanizma: `.github/workflows/deploy.yml` "Migration öncesi yedek" adımı
  (`pg_dump -U redwall redwall | gzip`).
- **Sınırlama:** Yedekler VDS'in kendi diskinde. Felaket dayanıklılığı için ayrı bir
  hedefe (S3/ayrı sunucu) off-site kopya önerilir — henüz yapılmadı (follow-up).

## Geri-yükleme PROVASI (prod'a sıfır risk — periyodik yap)
Gerçek `redwall` DB'sine DOKUNMADAN, yedeğin geri yüklenebilirliğini kanıtlar.
Geçici bir DB'ye yükler, doğrular, siler.

```bash
# VDS'te (sshpass ile SSH). PG = postgres container id.
PG=$(docker ps -qf name=redwall_postgres | head -1)
BK=$(ls -1t /opt/redwall/backups/pre-migrate-*.sql.gz | head -1)   # en güncel yedek

# 1) Temiz geçici DB (gerçek redwall DEĞİL)
docker exec "$PG" psql -U redwall -d postgres -c "DROP DATABASE IF EXISTS redwall_restore_test;"
docker exec "$PG" psql -U redwall -d postgres -c "CREATE DATABASE redwall_restore_test OWNER redwall;"

# 2) Yedeği geçici DB'ye geri yükle
zcat "$BK" | docker exec -i "$PG" psql -U redwall -d redwall_restore_test -q

# 3) Doğrula: satır sayıları canlı redwall ile eşleşmeli
docker exec "$PG" psql -U redwall -d redwall_restore_test -tA -c \
  "SELECT (SELECT count(*) FROM post), (SELECT count(*) FROM referans), (SELECT count(*) FROM project), (SELECT count(*) FROM form_gonderimi);"
docker exec "$PG" psql -U redwall -d redwall           -tA -c \
  "SELECT (SELECT count(*) FROM post), (SELECT count(*) FROM referans), (SELECT count(*) FROM project), (SELECT count(*) FROM form_gonderimi);"
# İki çıktı EŞLEŞMELİ.

# 4) Geçici DB'yi sil (temizlik)
docker exec "$PG" psql -U redwall -d postgres -c "DROP DATABASE redwall_restore_test;"
```

**Son prova:** 2026-07-05 — `pre-migrate-20260705-183033.sql.gz` geçici DB'ye temiz geri
yüklendi, satır sayıları canlı ile birebir eşleşti (post/referans/proje/form = 2/3/4/3),
gerçek `redwall` DB'sine dokunulmadı. ✅ Yedekler geri-yüklenebilir.

## GERÇEK FELAKET KURTARMA (yalnız veri kaybı/bozulmada — DİKKATLİ)
Bu, CANLI `redwall` DB'sini yedekten geri yükler → mevcut veriyi EZER. Sadece gerçek
kurtarma senaryosunda, tercihen önce bir güvenlik dump'ı alarak:

```bash
PG=$(docker ps -qf name=redwall_postgres | head -1)
BK=/opt/redwall/backups/pre-migrate-<istenen-tarih>.sql.gz

# 0) ÖNCE mevcut durumun güvenlik dump'ı (geri dönüş için)
docker exec "$PG" pg_dump -U redwall redwall | gzip > /opt/redwall/backups/manual-before-restore-$(date +%Y%m%d-%H%M%S).sql.gz

# 1) (Önerilir) web servisini durdur/ölçekle 0 → tutarlılık
docker service scale redwall_web=0

# 2) redwall DB'yi sıfırla + geri yükle
docker exec "$PG" psql -U redwall -d postgres -c "DROP DATABASE redwall;"
docker exec "$PG" psql -U redwall -d postgres -c "CREATE DATABASE redwall OWNER redwall;"
zcat "$BK" | docker exec -i "$PG" psql -U redwall -d redwall -q

# 3) web servisini geri getir
docker service scale redwall_web=2

# 4) doğrula: https://redwall.tr/api/health → {status:ok,db:ok}
```

## Öneriler (follow-up)
- **Off-site kopya:** yedekleri S3/başka sunucuya kopyala (VDS diski tek nokta arızası).
- **Periyodik prova:** yukarıdaki provayı ayda bir çalıştır (yedeğin bozulmadığını doğrula).
- **İzleme:** yedek boyutu ani düşerse (bozuk dump) alarm — ops/monitör sunucusuyla.
