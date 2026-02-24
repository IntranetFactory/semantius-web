#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from "fs";
import { createInterface } from "readline";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Check Node.js version for fetch API support
const nodeVersion = process.versions.node.split(".")[0];
if (parseInt(nodeVersion) < 18) {
  console.error(
    "Error: This script requires Node.js 18 or higher (for native fetch API)"
  );
  console.error(`Current version: ${process.version}`);
  console.error("Please upgrade Node.js or use manual setup (Option 2)");
  process.exit(1);
}

// ANSI color codes for better output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function createReadline() {
  return createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function prompt(question) {
  const rl = createReadline();
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function fetchWellKnown(url) {
  try {
    log(`\nFetching OIDC configuration from: ${url}`, colors.cyan);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const config = await response.json();
    log("✓ Successfully fetched OIDC configuration", colors.green);
    return config;
  } catch (error) {
    throw new Error(
      `Failed to fetch well-known configuration: ${error.message}`
    );
  }
}

function generateEnvContent(wellKnownConfig, clientId, redirectUri) {
  // Read .env.example to get template and comments
  const envExamplePath = join(projectRoot, ".env.example");
  let envExampleContent = "";

  try {
    envExampleContent = readFileSync(envExamplePath, "utf8");
  } catch (error) {
    // If .env.example doesn't exist, fall back to minimal config
    log(
      "\n⚠ Warning: .env.example not found, using minimal configuration",
      colors.yellow
    );
  }

  // Handle scopes_supported - can be array or space-separated string
  let scope = "openid";
  if (wellKnownConfig.scopes_supported) {
    const scopes = Array.isArray(wellKnownConfig.scopes_supported)
      ? wellKnownConfig.scopes_supported
      : wellKnownConfig.scopes_supported.split(" ");

    if (scopes.includes("openid")) {
      scope = "openid profile email";
    }
  }

  // If we have the template, use it and replace values
  if (envExampleContent) {
    return envExampleContent
      .replace(/^VITE_OAUTH_CLIENT_ID=.*/m, `VITE_OAUTH_CLIENT_ID=${clientId}`)
      .replace(
        /^VITE_OAUTH_AUTH_ENDPOINT=.*/m,
        `VITE_OAUTH_AUTH_ENDPOINT=${wellKnownConfig.authorization_endpoint}`
      )
      .replace(
        /^VITE_OAUTH_TOKEN_ENDPOINT=.*/m,
        `VITE_OAUTH_TOKEN_ENDPOINT=${wellKnownConfig.token_endpoint}`
      )
      .replace(
        /^VITE_OAUTH_REDIRECT_URI=.*/m,
        `VITE_OAUTH_REDIRECT_URI=${redirectUri}`
      )
      .replace(/^VITE_OAUTH_SCOPE=.*/m, `VITE_OAUTH_SCOPE=${scope}`)
      .replace(
        /^VITE_OAUTH_USERINFO_ENDPOINT=.*/m,
        `VITE_OAUTH_USERINFO_ENDPOINT=${wellKnownConfig.userinfo_endpoint || ""}`
      )
      .replace(
        /^VITE_OAUTH_LOGOUT_ENDPOINT=.*/m,
        `VITE_OAUTH_LOGOUT_ENDPOINT=${wellKnownConfig.end_session_endpoint || ""}`
      )
      .replace(
        /^VITE_OAUTH_LOGOUT_REDIRECT=.*/m,
        `VITE_OAUTH_LOGOUT_REDIRECT=${redirectUri}`
      )
      .replace(
        /^# OAuth2\/OIDC Configuration\n# Replace these values with your OAuth provider's settings/m,
        "# OAuth2/OIDC Configuration\n# Generated from OIDC well-known endpoint"
      );
  }

  // Fallback to minimal config if template not available
  return `# OAuth2/OIDC Configuration
# Generated from OIDC well-known endpoint

VITE_OAUTH_CLIENT_ID=${clientId}
VITE_OAUTH_AUTH_ENDPOINT=${wellKnownConfig.authorization_endpoint}
VITE_OAUTH_TOKEN_ENDPOINT=${wellKnownConfig.token_endpoint}
VITE_OAUTH_REDIRECT_URI=${redirectUri}
VITE_OAUTH_SCOPE=${scope}
VITE_OAUTH_USERINFO_ENDPOINT=${wellKnownConfig.userinfo_endpoint || ""}
VITE_OAUTH_LOGOUT_ENDPOINT=${wellKnownConfig.end_session_endpoint || ""}
VITE_OAUTH_LOGOUT_REDIRECT=${redirectUri}

# API Configuration (REQUIRED)
VITE_API_BASE_URL=
VITE_API_TYPE=
VITE_SUPABASE_APIKEY=
`;
}

function manualSetup() {
  const envExamplePath = join(projectRoot, ".env.example");
  const envPath = join(projectRoot, ".env");

  if (!existsSync(envExamplePath)) {
    log("\n✗ .env.example file not found!", colors.red);
    process.exit(1);
  }

  const content = readFileSync(envExamplePath, "utf8");
  writeFileSync(envPath, content);

  log("\n✓ Created .env file from .env.example", colors.green);
  log(
    "✓ Please edit .env and replace placeholder values with your actual OAuth configuration",
    colors.yellow
  );
}

function validateOIDCConfig(config) {
  // Check for required OIDC endpoints
  return config.authorization_endpoint && config.token_endpoint;
}

async function main() {
  log("\n" + "=".repeat(60), colors.bright);
  log("  Semantius UI - OAuth Configuration Generator", colors.bright);
  log("=".repeat(60) + "\n", colors.bright);

  const envPath = join(projectRoot, ".env");

  if (existsSync(envPath)) {
    const overwrite = await prompt(
      `${colors.yellow}⚠ .env file already exists. Overwrite? (y/N): ${colors.reset}`
    );
    if (overwrite.toLowerCase() !== "y") {
      log("\nAborted. Existing .env file preserved.", colors.yellow);
      process.exit(0);
    }
  }

  log("Choose configuration method:", colors.cyan);
  log("  1. Auto-configure from OIDC well-known endpoint (recommended)");
  log("  2. Manual setup from .env.example\n");

  const choice = await prompt("Enter your choice (1 or 2): ");

  if (choice === "2") {
    manualSetup();
    process.exit(0);
  }

  if (choice !== "1") {
    log("\n✗ Invalid choice. Exiting.", colors.red);
    process.exit(1);
  }

  // Auto-configure from well-known endpoint
  log("\n" + "-".repeat(60), colors.cyan);
  log("Auto-configuration from OIDC Discovery", colors.bright);
  log("-".repeat(60) + "\n", colors.cyan);

  const wellKnownUrl = await prompt(
    "Enter your OIDC well-known endpoint URL\n" +
      "(e.g., https://your-auth-server.com/.well-known/openid-configuration): "
  );

  if (!wellKnownUrl) {
    log("\n✗ No URL provided. Exiting.", colors.red);
    process.exit(1);
  }

  let wellKnownConfig;
  try {
    wellKnownConfig = await fetchWellKnown(wellKnownUrl);
  } catch (error) {
    log(`\n✗ ${error.message}`, colors.red);
    log("\nTip: Make sure the URL is correct and accessible", colors.yellow);
    process.exit(1);
  }

  // Validate required fields
  if (!validateOIDCConfig(wellKnownConfig)) {
    log(
      "\n✗ Invalid OIDC configuration: missing required endpoints",
      colors.red
    );
    log("Required: authorization_endpoint and token_endpoint", colors.yellow);
    process.exit(1);
  }

  log("\nDiscovered endpoints:", colors.cyan);
  log(`  • Authorization: ${wellKnownConfig.authorization_endpoint}`);
  log(`  • Token: ${wellKnownConfig.token_endpoint}`);
  if (wellKnownConfig.userinfo_endpoint) {
    log(`  • UserInfo: ${wellKnownConfig.userinfo_endpoint}`);
  }
  if (wellKnownConfig.end_session_endpoint) {
    log(`  • Logout: ${wellKnownConfig.end_session_endpoint}`);
  }

  const clientId = await prompt("\nEnter your OAuth Client ID: ");
  if (!clientId) {
    log("\n✗ Client ID is required. Exiting.", colors.red);
    process.exit(1);
  }

  const defaultRedirect = "http://localhost:5173";
  const redirectUri =
    (await prompt(`Enter redirect URI (default: ${defaultRedirect}): `)) ||
    defaultRedirect;

  const envContent = generateEnvContent(wellKnownConfig, clientId, redirectUri);

  try {
    writeFileSync(envPath, envContent);
    log("\n" + "=".repeat(60), colors.green);
    log("✓ Successfully generated .env file!", colors.bright + colors.green);
    log("=".repeat(60), colors.green);
    log("\nConfiguration saved with:", colors.cyan);
    log(`  • Client ID: ${clientId}`);
    log(`  • Redirect URI: ${redirectUri}`);
    log(
      `  • Authorization Endpoint: ${wellKnownConfig.authorization_endpoint}`
    );
    log(`  • Token Endpoint: ${wellKnownConfig.token_endpoint}`);
    if (wellKnownConfig.userinfo_endpoint) {
      log(`  • UserInfo Endpoint: ${wellKnownConfig.userinfo_endpoint}`);
    }

    log("\n" + "=".repeat(60), colors.yellow);
    log(
      "⚠ IMPORTANT: Add this redirect URI to your OAuth provider:",
      colors.bright + colors.yellow
    );
    log("=".repeat(60), colors.yellow);
    log(`\n  ${redirectUri}\n`, colors.bright + colors.cyan);
    log(
      "This redirect URI must be registered in your OAuth provider's",
      colors.yellow
    );
    log("allowed callback URLs / redirect URIs configuration.", colors.yellow);
    log("Without this, authentication will fail!\n", colors.yellow);

    log(
      "✓ You can now start the development server with: npm run dev",
      colors.green
    );
  } catch (error) {
    log(`\n✗ Failed to write .env file: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n✗ Unexpected error: ${error.message}`, colors.red);
  process.exit(1);
});
