# Payment methods — what each one needs before a line of code

The same payment methods come back project after project (Venezuela and Colombia, mostly),
and each starts with the same question: what does the client have to provide, what does it
cost, how long does approval take. This file answers it up front, so the kickoff can ask
the client for everything at once and the cost goes into the quote (César, 2026-10-29).

**How it is used:**
- `project-kickoff`, when the site takes payments: for each method the client wants, the
  "Client provides" column goes to `CONTENT_CHECKLIST.md` as pending items with the client
  as owner, and the costs go to `PROJECT_CONTEXT.md` § Payments. Approvals take days or
  weeks: they are asked for in phase 00, not in phase 07.
- `backend-build`, when it implements one: the "Integration" column, then Context7 / the
  provider's docs for the current API (they change), and §2 Payments of the skill (hosted
  flow, price on the server, signed and idempotent webhooks, status by webhook).
- **Costs are what César recorded on the date shown**: check the provider's page before
  quoting a client. A row that changes gets its new date.

---

## Summary

| Method | Country | Kind | Client provides | Costs (as recorded) | Sandbox |
|---|---|---|---|---|---|
| **Cashea** | VE | Buy now, pay later (installments) | RIF; company: Acta Constitutiva · entrepreneurship: certificate of the Registro Nacional de Emprendimiento · personal firm: documento constitutivo; cédula of the signers | Initial payment $50 + IVA; commission 2 %–5 % by business type; advance commission 2 %–4 % by business type (2026-10-29) | Ask Cashea at sign-up |
| **PayPal** | International | Wallet / card (hosted) | A PayPal **Business** account; the agent (or César) creates the app in the developer dashboard | 5.4 % + $0.30 per transaction (international rate, 2026-10-29) | Yes: developer account, app, sandbox Client ID and Secret |
| **Bancolombia** | CO | Bank API / button | Access request to the developers' Sandbox ([how to request it](https://soportedevs.bancolombia.com/hc/es-419/articles/12467698138388--C%C3%B3mo-solicito-el-ingreso-a-Sandbox)); production needs the client's agreement with the bank | To confirm with the bank | Yes, on request |
| **Binance Pay** | International (crypto) | Crypto payment (hosted checkout) | A Binance **business** account ([register](https://accounts.binance.com/es/register-business)), verified (KYB) | To confirm in Binance Pay merchant terms | To confirm |
| **Pago Móvil** (Banesco, Mercantil, Venezuela, Bancaribe) | VE | Bank transfer between phones | Phone, RIF/cédula and bank of the receiving account; for automatic verification, the bank's API agreement | To confirm per bank | Per bank |

## Per method

### Cashea
- **Requirements** (2026-10-29): RIF; one constitutive document depending on the legal
  form (Acta Constitutiva for a company, certificate of the Registro Nacional de
  Emprendimiento for an entrepreneurship, documento constitutivo for a personal firm);
  cédula of each signer.
- **Costs**: $50 + IVA once; 2 %–5 % commission and 2 %–4 % for advances, by business
  type.
- **Integration**: what Cashea gives the merchant once approved (checkout, API or link):
  record it here with the first project that implements it.

### PayPal
- **Requirements**: PayPal Business account; in developer.paypal.com an app, which gives
  the **sandbox** Client ID and Client Secret (and live ones once approved). Sandbox buyer
  and seller accounts come with the developer account.
- **Costs**: 5.4 % + $0.30 (2026-10-29).
- **Integration**: PayPal JS SDK buttons (hosted: no card data on the site) + Orders API on
  the server (create and capture the order with the price computed there) + webhook
  verified with PayPal's signature. Idempotency: `PayPal-Request-Id` header on create and
  capture. `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` in `ENV_MAP`;
  sandbox values in `.env.local`, live ones only in Vercel.

### Bancolombia
- **Requirements**: request access to the Sandbox (link above); production requires the
  client's commercial agreement with Bancolombia, which only the client can sign.
- **Integration**: per the API the bank enables for the client (button, transfer, QR):
  record it here with the first project.

### Binance Pay
- **Requirements**: business account, verified; Binance Pay merchant activation gives the
  API key and secret.
- **Integration**: create the order on the server, redirect to Binance's hosted checkout,
  confirm by the signed webhook. Prices in crypto or stablecoin: the conversion and who
  absorbs the volatility is a business decision, asked at kickoff.

### Pago Móvil (Banesco, Mercantil, Venezuela, Bancaribe)
- **Two ways to confirm a payment**, decided at kickoff because they change the flow:
  1. **Manual**: the site shows the receiving data (bank, phone, RIF/cédula, exact amount
     in Bs at the day's rate), the customer pays from their bank app and reports the
     reference number; the order stays "pending verification" until an admin confirms it
     in the panel. No bank agreement needed; the cost is the admin's time, and the order
     must not ship before confirmation.
  2. **Automatic**: the bank's verification API (it confirms a reference and amount), with
     the client's agreement with that bank. One integration per bank.
- **Always**: the amount in Bs computed on the server from the rate of the day (source of
  the rate recorded in a decision), a unique reference per order so one transfer cannot
  confirm two orders, and the rate and amount saved with the order.
- **Requirements, costs and APIs per bank**: to fill in as the first projects use them.
