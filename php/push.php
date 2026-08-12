<?php
/**
 * push.php voor CashMetTrash
 *
 * Verstuurt pushmeldingen via Firebase Cloud Messaging. Hoort naast
 * checkout.php en stripe-proxy.php in /uploads/cashmettrash/ op internedata.nl.
 *
 * Waarom via deze proxy: het versturen van een melding vereist een
 * servicesleutel, en die hoort niet in de browser. De app vraagt hier alleen
 * "stuur dit naar rol jayce" of "naar deze klant"; de proxy zoekt zelf op welke
 * apparaten daarbij horen. Zo hoeft de app nooit tokens van anderen te kennen.
 *
 * INSTALLATIE
 * 1. Maak in de Firebase Console een servicesleutel aan:
 *    Projectinstellingen > Serviceaccounts > Nieuwe persoonlijke sleutel genereren.
 * 2. Zet het gedownloade JSON-bestand NAAST dit script en noem het
 *    service-account.json. Zet het bestand op 600 en zorg dat het niet publiek
 *    opvraagbaar is (zie de .htaccess-regel onderaan dit commentaar).
 * 3. Vul hieronder PROJECT_ID in.
 *
 * Blokkeer het JSON-bestand met een .htaccess in dezelfde map:
 *
 *   <Files "service-account.json">
 *     Require all denied
 *   </Files>
 */

declare(strict_types=1);

const PROJECT_ID = 'VUL-HIER-JE-FIREBASE-PROJECT-ID-IN';
const SERVICE_ACCOUNT = __DIR__ . '/service-account.json';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fout(405, 'Alleen POST');
}

function fout(int $code, string $bericht): void
{
    http_response_code($code);
    echo json_encode(['error' => $bericht]);
    exit;
}

function base64UrlDecode(string $data): string
{
    return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
}

function base64UrlEncode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/* -------------------------------------------------------------------------
   1. Controleren wie er belt
   ------------------------------------------------------------------------- */

/**
 * Verifieert het Firebase ID-token uit de Authorization-header. Zonder deze
 * controle zou iedereen die de URL kent meldingen kunnen versturen.
 */
function geverifieerdeGebruiker(): array
{
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) {
        fout(401, 'Geen token meegestuurd');
    }
    $jwt = $m[1];

    $delen = explode('.', $jwt);
    if (count($delen) !== 3) {
        fout(401, 'Ongeldig token');
    }
    [$kopB64, $ladingB64, $handtekeningB64] = $delen;

    $kop = json_decode(base64UrlDecode($kopB64), true);
    $lading = json_decode(base64UrlDecode($ladingB64), true);
    if (!is_array($kop) || !is_array($lading)) {
        fout(401, 'Ongeldig token');
    }

    // Publieke sleutels van Google, kort gecachet zodat we ze niet elke keer ophalen.
    $cache = sys_get_temp_dir() . '/cmt-google-keys.json';
    $sleutels = null;
    if (is_readable($cache) && (time() - filemtime($cache)) < 3600) {
        $sleutels = json_decode((string) file_get_contents($cache), true);
    }
    if (!is_array($sleutels)) {
        $ruw = @file_get_contents(
            'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
        );
        $sleutels = json_decode((string) $ruw, true);
        if (!is_array($sleutels)) {
            fout(503, 'Kon sleutels van Google niet ophalen');
        }
        @file_put_contents($cache, json_encode($sleutels));
    }

    $certificaat = $sleutels[$kop['kid'] ?? ''] ?? null;
    if (!$certificaat) {
        fout(401, 'Onbekende sleutel');
    }

    $geldig = openssl_verify(
        $kopB64 . '.' . $ladingB64,
        base64UrlDecode($handtekeningB64),
        openssl_pkey_get_public($certificaat),
        OPENSSL_ALGO_SHA256
    );
    if ($geldig !== 1) {
        fout(401, 'Handtekening klopt niet');
    }

    $nu = time();
    if (($lading['exp'] ?? 0) < $nu) {
        fout(401, 'Token verlopen');
    }
    if (($lading['aud'] ?? '') !== PROJECT_ID) {
        fout(401, 'Token hoort bij een ander project');
    }
    if (($lading['iss'] ?? '') !== 'https://securetoken.google.com/' . PROJECT_ID) {
        fout(401, 'Onverwachte uitgever');
    }

    return $lading;
}

/* -------------------------------------------------------------------------
   2. Toegang tot Google-diensten
   ------------------------------------------------------------------------- */

/** Wisselt de servicesleutel om voor een toegangstoken. */
function toegangstoken(): string
{
    if (!is_readable(SERVICE_ACCOUNT)) {
        fout(500, 'service-account.json ontbreekt op de server');
    }
    $account = json_decode((string) file_get_contents(SERVICE_ACCOUNT), true);
    if (!is_array($account)) {
        fout(500, 'service-account.json is onleesbaar');
    }

    $nu = time();
    $kop = base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
    $lading = base64UrlEncode(json_encode([
        'iss'   => $account['client_email'],
        'scope' => 'https://www.googleapis.com/auth/firebase.messaging '
                 . 'https://www.googleapis.com/auth/datastore',
        'aud'   => 'https://oauth2.googleapis.com/token',
        'iat'   => $nu,
        'exp'   => $nu + 3600,
    ]));

    openssl_sign($kop . '.' . $lading, $handtekening, $account['private_key'], OPENSSL_ALGO_SHA256);
    $jwt = $kop . '.' . $lading . '.' . base64UrlEncode($handtekening);

    $antwoord = httpPost('https://oauth2.googleapis.com/token', http_build_query([
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion'  => $jwt,
    ]), ['Content-Type: application/x-www-form-urlencoded']);

    $data = json_decode($antwoord['body'], true);
    if (empty($data['access_token'])) {
        fout(502, 'Kon geen toegangstoken krijgen');
    }
    return $data['access_token'];
}

function httpPost(string $url, string $body, array $headers): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
    ]);
    $antwoord = (string) curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['status' => $code, 'body' => $antwoord];
}

function httpGet(string $url, array $headers): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
    ]);
    $antwoord = (string) curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['status' => $code, 'body' => $antwoord];
}

/* -------------------------------------------------------------------------
   3. Ontvangers opzoeken en versturen
   ------------------------------------------------------------------------- */

/** Haalt alle pushTokens op en filtert op rol of op één klant. */
function tokensVoor(string $accessToken, ?string $rol, ?string $customerId): array
{
    $basis = 'https://firestore.googleapis.com/v1/projects/' . PROJECT_ID
           . '/databases/(default)/documents/pushTokens';

    // Eén klant: rechtstreeks het document opvragen, dat scheelt een lijst.
    if ($customerId !== null) {
        $antwoord = httpGet($basis . '/' . rawurlencode($customerId), [
            'Authorization: Bearer ' . $accessToken,
        ]);
        if ($antwoord['status'] !== 200) {
            return [];
        }
        $doc = json_decode($antwoord['body'], true);
        $token = $doc['fields']['token']['stringValue'] ?? null;
        return $token ? [$token] : [];
    }

    $tokens = [];
    $paginatie = '';
    do {
        $antwoord = httpGet($basis . '?pageSize=300' . $paginatie, [
            'Authorization: Bearer ' . $accessToken,
        ]);
        if ($antwoord['status'] !== 200) {
            break;
        }
        $data = json_decode($antwoord['body'], true);
        foreach ($data['documents'] ?? [] as $doc) {
            $velden = $doc['fields'] ?? [];
            if ($rol !== null && (($velden['rol']['stringValue'] ?? '') !== $rol)) {
                continue;
            }
            if (!empty($velden['token']['stringValue'])) {
                $tokens[] = $velden['token']['stringValue'];
            }
        }
        $paginatie = !empty($data['nextPageToken'])
            ? '&pageToken=' . rawurlencode($data['nextPageToken'])
            : '';
    } while ($paginatie !== '');

    return array_values(array_unique($tokens));
}

/* -------------------------------------------------------------------------
   4. Afhandeling
   ------------------------------------------------------------------------- */

$gebruiker = geverifieerdeGebruiker();

$invoer = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($invoer)) {
    fout(400, 'Ongeldige invoer');
}

$titel = trim((string) ($invoer['titel'] ?? ''));
$tekst = trim((string) ($invoer['tekst'] ?? ''));
$url   = (string) ($invoer['url'] ?? '/');
$rol   = isset($invoer['rol']) ? (string) $invoer['rol'] : null;
$klant = isset($invoer['customerId']) ? (string) $invoer['customerId'] : null;

if ($titel === '' || $tekst === '') {
    fout(400, 'Titel en tekst zijn verplicht');
}
if ($rol === null && $klant === null) {
    fout(400, 'Geef een rol of een customerId op');
}
if ($rol !== null && !in_array($rol, ['klant', 'jayce', 'admin'], true)) {
    fout(400, 'Onbekende rol');
}

$accessToken = toegangstoken();
$tokens = tokensVoor($accessToken, $rol, $klant);

if (count($tokens) === 0) {
    echo json_encode(['verstuurd' => 0, 'reden' => 'geen geregistreerde apparaten']);
    exit;
}

$verstuurd = 0;
$mislukt = [];

foreach ($tokens as $token) {
    // Het eigen apparaat overslaan heeft geen zin: de afzender kan een ander
    // apparaat hebben. FCM ontdubbelt zelf op token.
    $bericht = [
        'message' => [
            'token'        => $token,
            'notification' => ['title' => $titel, 'body' => $tekst],
            'data'         => ['url' => $url],
            'webpush'      => [
                'fcm_options' => ['link' => $url],
                'notification' => ['icon' => '/icon-192.png?v=2'],
            ],
        ],
    ];

    $antwoord = httpPost(
        'https://fcm.googleapis.com/v1/projects/' . PROJECT_ID . '/messages:send',
        json_encode($bericht),
        ['Authorization: Bearer ' . $accessToken, 'Content-Type: application/json']
    );

    if ($antwoord['status'] === 200) {
        $verstuurd++;
    } else {
        $mislukt[] = $antwoord['status'];
    }
}

echo json_encode([
    'verstuurd' => $verstuurd,
    'mislukt'   => count($mislukt),
    'afzender'  => $gebruiker['user_id'] ?? null,
]);
