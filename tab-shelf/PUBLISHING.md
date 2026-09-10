# Publishing Tab Shelf from GitHub

The **Tab Shelf release** GitHub Actions workflow tests the extension, builds a ZIP with its manifest at the root, and saves it as a downloadable artifact. Portfolio commits do not submit store updates. The source of release builds is `tab-shelf/extension/` in this repository.

## One-time setup

1. In the Chrome Web Store developer dashboard, create Tab Shelf by uploading the initial ZIP. Complete its store listing, screenshots, privacy disclosures and distribution settings. Copy its **store item ID** (not the ID of your unpacked local extension). Copy your **publisher ID** from Publisher → Settings. Enable two-step verification on the developer account.
2. Follow [Google's API authorization guide](https://developer.chrome.com/docs/webstore/using-api): create/select a Google Cloud project, enable Chrome Web Store API, configure OAuth consent, create a Web application OAuth client, and add `https://developers.google.com/oauthplayground` as an authorized redirect URI.
3. In OAuth Playground settings, select **Use your own OAuth credentials**, enter that client's ID and secret, authorize scope `https://www.googleapis.com/auth/chromewebstore` with the account that owns the listing, then exchange the code for a refresh token. Use production OAuth publishing status for durable credentials; external apps left in Testing can have refresh tokens expire after seven days. Keep the refresh token private.
4. In this repository's **Settings → Secrets and variables → Actions**, add these repository secrets:
   - `CWS_CLIENT_ID`
   - `CWS_CLIENT_SECRET`
   - `CWS_REFRESH_TOKEN`
5. On the Variables tab, add `CWS_PUBLISHER_ID` and `CWS_EXTENSION_ID`.

Do not commit credentials or paste them into issues, chat or workflow inputs. No Google credentials are configured by the workflow itself.

## Release an update

1. Update the extension code in `tab-shelf/extension/`, increase `manifest.json`'s version, and commit/push to `gh-pages`.
2. Create and push a matching tag, for example `tab-shelf-v1.2.2` for version `1.2.2`.
3. Actions runs tests, packages the extension, uploads it, waits for successful processing, then submits it for Google review. Google publishes automatically after approval using the listing's existing visibility settings. A successful submission does not mean the extension is already live.

You can also open **Actions → Tab Shelf release → Run workflow** on `gh-pages` and choose:

- **build**: test and download the package; requires no Google setup.
- **upload**: upload a draft without submitting for review.
- **submit**: upload and submit for review.

Use a new, higher version for every store upload. Do not rerun a completed upload blindly: if a run fails or times out, check the developer dashboard first, since Google may already have accepted the request. Store warnings stop automatic submission. Avoid manual dashboard uploads while a release workflow is running. This automation does not create the initial listing, supply screenshots/disclosures, or bypass Google's review.

API reference: [upload](https://developer.chrome.com/docs/webstore/api/reference/rest/v2/media/upload), [upload status](https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/fetchStatus), [submit](https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/publish).
