# 搬到公司內網伺服器 — 部署指南

這份指南假設：原始碼繼續放在 GitHub 管理，只把「網站主機」跟「資料庫」
搬到公司內網的伺服器上，用 Docker 執行。

## 前置需求

內網那台伺服器需要先裝好：
- **Docker** 與 **Docker Compose**（新版 Docker Desktop / Docker Engine 都內建 `docker compose` 指令，不確定的話可以請 IT 協助安裝）
- 能連上 GitHub 把程式碼拉下來（`git clone` 這個 repo）
- 建議：一個固定的內網位址（例如 `pm.internal.company.com` 或固定內網 IP），方便大家記得怎麼連

## 第一次部署

1. 在伺服器上把程式碼拉下來：
   ```bash
   git clone https://github.com/emilychp/CM-marcom-PM.git
   cd CM-marcom-PM
   ```

2. 複製環境變數範本，填入實際值：
   ```bash
   cp deploy/.env.production.example .env
   ```
   打開 `.env` 編輯：
   - `POSTGRES_PASSWORD`：自己設一組夠長的密碼
   - `DATABASE_URL`：把裡面的密碼換成跟上面一致
   - `AUTH_SECRET`：執行 `openssl rand -base64 32`，把結果貼進去
   - `NEXTAUTH_URL`：填伺服器實際的內網位址（例如 `http://192.168.1.50:3000`）
   - `RESEND_API_KEY` / `REMINDER_FROM_EMAIL` / `CRON_SECRET`：如果要保留「每週進度提醒信」功能才需要填，不填的話這個功能就是關閉，其他功能不受影響

3. 建置並啟動：
   ```bash
   docker compose up -d --build
   ```
   第一次會需要幾分鐘建置映像檔。完成後，資料庫的資料表結構會自動建立好（`migrate` 這個服務會先跑完 `prisma migrate deploy` 才會啟動主程式）。

4. 打開瀏覽器連到 `http://<伺服器位址>:3000`，應該會看到登入畫面（此時資料庫是空的，還沒有帳號）。

## 建立第一個管理員帳號

資料庫是空的時候，用這個指令建立第一個系統管理員帳號：

```bash
docker compose run --rm \
  -e ADMIN_NAME="您的名字" \
  -e ADMIN_EMAIL="您的信箱" \
  -e ADMIN_PASSWORD="一組夠強的密碼" \
  migrate npx tsx prisma/create-admin.ts
```

跑完之後，就可以用這組帳密登入了。

## 搬遷現有資料（專案、任務、附件）

如果不是從空白開始，而是要把目前正式環境（Vercel + Neon）的資料一起搬過來，分成「資料庫」跟「附件檔案」兩部分：

### 1. 資料庫（專案、任務、成員…等所有資料表）

這部分需要用 `pg_dump` / `psql` 直接在兩個資料庫之間搬資料，我這邊沒有正式資料庫的存取權限，這步驟需要您或 IT 執行：

1. 到 Vercel 專案設定裡找到現在的 `DATABASE_URL`（Neon 的連線字串），複製下來
2. 在**任何一台能連上網路的電腦**（不一定要是內網伺服器，只要裝了 PostgreSQL 的用戶端工具）執行：
   ```bash
   pg_dump --data-only --no-owner --no-privileges "<Neon 的 DATABASE_URL>" > data.sql
   ```
3. 把 `data.sql` 複製到內網伺服器上（隨便用什麼方式傳都可以），確保新的容器已經先啟動過一次（第一次部署的步驟 3 已經建好資料表結構），然後匯入：
   ```bash
   docker compose exec -T db psql -U app -d app < data.sql
   ```
4. 修正附件的儲存路徑——正式環境的附件是存在 Vercel Blob，資料庫裡記錄的是完整網址；搬到內網後檔案會變成存在本機硬碟，路徑格式不一樣，匯入完 `data.sql` 之後要跑這段 SQL 修正：
   ```bash
   docker compose exec -T db psql -U app -d app <<'EOF'
   UPDATE "Attachment" SET "storageKey" = regexp_replace("storageKey", '^https://[^/]+/', '') WHERE "storageKey" LIKE 'https://%';
   UPDATE "Attachment" SET "thumbnailStorageKey" = regexp_replace("thumbnailStorageKey", '^https://[^/]+/', '') WHERE "thumbnailStorageKey" LIKE 'https://%';
   EOF
   ```

### 2. 附件檔案

正式環境目前的附件檔案（124 個檔案，約 98MB）我已經先幫您匯出打包好了，檔名是 `attachments-export.zip`（另外傳給您）。裡面的資料夾結構已經對應好，搬過去的方式：

```bash
# 解壓縮後，把裡面的內容複製進 app 容器的 uploads volume
docker compose cp attachments-export/. app:/app/uploads/
# 記得排除 manifest.json 這個清單檔，它不是附件本體，複製進去也不影響運作但可以跳過
```

如果之後正式環境又有新的附件上傳（在完全切換過去之前），可以重新執行 `deploy/export-attachments.mjs` 這個腳本再匯出一次最新的（用法寫在檔案開頭的註解）。

## 每週進度提醒信（選用）

現有系統是用 Vercel 的排程功能，每週五凌晨自動寄信提醒。內網伺服器沒有這個功能，如果想保留，在伺服器上設定系統排程（crontab）：

```bash
crontab -e
# 加入這一行（每週五 09:00 執行，時間可自行調整）：
0 9 * * 5 curl -s -H "Authorization: Bearer <CRON_SECRET的值>" http://localhost:3000/api/cron/weekly-reminder
```

## 之後怎麼更新版本

原始碼還是放在 GitHub，以後我在這邊完成新功能、推上 GitHub 之後，伺服器上執行：

```bash
git pull
docker compose up -d --build
```

`migrate` 服務會自動先套用新的資料庫異動，再重啟主程式，跟現在 Vercel 自動部署的行為類似，只是要手動下這行指令。

## 備份建議

搬到自己維護之後，備份不會再像 Neon/Vercel Blob 那樣自動處理，建議至少：
- 資料庫：排程執行 `docker compose exec -T db pg_dump -U app app > backup-$(date +%F).sql`，定期存到別的地方
- 附件檔案：`uploads` 這個 volume 定期備份（實際位置可以用 `docker volume inspect cm-marcom-pm_uploads` 查）
