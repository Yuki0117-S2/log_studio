# Log Studio

로그 꾸미기 편집기 4종을 한 저장소에 모아 두고, `index.html` 메뉴판에서 골라 이동하는 구조입니다.

```
log_studio/
├─ index.html        ← 메뉴판 (여기서 시작)
├─ .nojekyll         ← GitHub Pages가 파일을 그대로 서빙하도록 하는 빈 파일
├─ memorial-log/     ← Memorial Log (© @gim)
├─ log-cupcake/      ← Log Cupcake (aperia6788/Log_Cupcake)
├─ mosaic-log/       ← 조각로그 (mosaic-log/mosaic-log.github.io)
└─ log-diary/        ← Log Diary (log-diary/log-diary.github.io)
```

## 올리는 방법 (GitHub 웹만 사용)

1. `log_studio` 저장소 페이지에서 **Add file → Upload files**.
2. 이 ZIP을 풀어서 나온 **내용물 전체**(index.html, .nojekyll, 폴더 4개)를 드래그해서 올립니다.
   - `log_studio` 폴더 자체가 아니라 그 안의 파일들을 올려야 합니다. 저장소 루트에 `index.html`이 바로 보여야 합니다.
   - 파일이 많으면(총 53개, 약 40MB) 업로드가 한 번에 안 될 수 있습니다. 그럴 땐 폴더 하나씩 나눠서 올리면 됩니다.
3. **Commit changes**.
4. **Settings → Pages → Build and deployment → Source: Deploy from a branch**, Branch: `main` / `/(root)` → Save.
5. 1~2분 뒤 `https://<계정>.github.io/log_studio/` 로 접속.

## 갱신할 때

원작자가 업데이트한 것을 반영하려면 해당 하위 폴더만 새 파일로 덮어쓰면 됩니다. `index.html`(메뉴판)은 건드리지 않아도 됩니다.
