#!/bin/bash
# setup-framework-links.sh

FRAMEWORK_PATH="/home/admin/deno-genesis"
SITES_PATH="/home/admin/deno-genesis/sites"

echo "🚀 Setting up DenoGenesis Framework Links..."

# Create framework directory if it doesn't exist
mkdir -p "$FRAMEWORK_PATH"
mkdir -p "$SITES_PATH"

# List of your sites
SITES=(
    "pedromdominguez"
    "domingueztechsolutions"
    "heavenlyroofingok"
    "okdevs"
    "efficientmoversllc"
)

# Create symbolic links for each site
for site in "${SITES[@]}"; do
    SITE_PATH="$SITES_PATH/$site"

    if [ -d "$SITE_PATH" ]; then
        echo "📁 Setting up links for: $site"

        # Remove existing framework directories if they exist
        rm -rf "$SITE_PATH/middleware"
        rm -rf "$SITE_PATH/database"
        rm -rf "$SITE_PATH/config"
        rm -rf "$SITE_PATH/utils"
        rm -rf "$SITE_PATH/types"

        # Create symbolic links to framework
        ln -sf "$FRAMEWORK_PATH/core/middleware" "$SITE_PATH/middleware"
        ln -sf "$FRAMEWORK_PATH/core/database" "$SITE_PATH/database"
        ln -sf "$FRAMEWORK_PATH/core/config" "$SITE_PATH/config"
        ln -sf "$FRAMEWORK_PATH/core/utils" "$SITE_PATH/utils"
        ln -sf "$FRAMEWORK_PATH/core/types" "$SITE_PATH/types"

        # Link shared components
        ln -sf "$FRAMEWORK_PATH/shared-components" "$SITE_PATH/public/shared-components"

        echo "✅ Links created for $site"
    else
        echo "⚠️  Site directory not found: $site"
    fi
done

echo "🎯 Framework linking complete!"
echo "📍 Framework location: $FRAMEWORK_PATH"
echo "🔗 All sites now use centralized framework"
