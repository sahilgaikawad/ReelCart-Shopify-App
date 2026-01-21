import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router"; // Fixed for latest Shopify template
import {
    Page, Layout, Card, BlockStack, Text, Button,
    Select, Banner, InlineStack, Badge, Box, Divider,
    AccountConnection, Link
} from "@shopify/polaris";
import { ExternalIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";

/* ================= LOADER (Fixed: No Crash Logic) ================= */
export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);

    // Upsert: Agar settings nahi hai to default create karega, warna existing layega
    const settings = await db.appSettings.upsert({
        where: { shop: session.shop },
        update: {}, // Update nothing if exists
        create: {
            shop: session.shop,
            cartAction: "ajax",
            autoSync: false,
            primaryColor: "#000000",
            buttonTextColor: "#ffffff"
        }
    });

    return {
        settings,
        shop: session.shop
    };
};

/* ================= ACTION (Saves Data) ================= */
export const action = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();

    const data = {};

    // Cart Action Update
    if (formData.has("cartAction")) {
        data.cartAction = formData.get("cartAction");
    }

    // Auto Sync Update
    if (formData.has("autoSync")) {
        data.autoSync = formData.get("autoSync") === "true";
    }

    if (Object.keys(data).length > 0) {
        await db.appSettings.update({
            where: { shop: session.shop },
            data: data
        });
        return { success: true };
    }

    return null;
};

/* ================= COMPONENT ================= */
export default function SettingsPage() {
    const { settings, shop } = useLoaderData();
    const fetcher = useFetcher();

    // Local State
    const [connected, setConnected] = useState(!!settings?.instagramToken);
    const [cartAction, setCartAction] = useState(settings?.cartAction || "ajax");

    const handleConnect = () => {
        // Future: Add OAuth logic here
        setConnected(true);
    };

    const handleDisconnect = () => {
        setConnected(false);
        // Future: Add disconnect logic via action
    };

    const handleSave = (newValue) => {
        fetcher.submit({ cartAction: newValue }, { method: "post" });
    };

    const accountMarkup = connected ? (
        <AccountConnection
            accountName="Sahil's Store (Instagram)"
            connected={true}
            title="Instagram Connected"
            action={{ content: 'Disconnect', onAction: handleDisconnect }}
            details="Reels will be synced from this account."
        />
    ) : (
        <AccountConnection
            accountName=""
            connected={false}
            title="Connect Instagram"
            action={{ content: 'Connect', onAction: handleConnect }}
            details="Connect your account to fetch reels automatically."
        />
    );

    return (
        <Page title="General Settings" subtitle="Manage integrations, behavior and billing.">
            <Layout>

                {/* --- 1. BILLING BANNER --- */}
                <Layout.Section>
                    <Banner title="You are on the Free Plan" tone="info">
                        <p>Upgrade to <strong>Pro</strong> to unlock Unlimited Reels, remove branding, and enable Auto-Sync.</p>
                        <Box paddingBlockStart="200">
                            <Button variant="primary">Upgrade to Pro ($9.99/mo)</Button>
                        </Box>
                    </Banner>
                </Layout.Section>

                {/* --- 2. INTEGRATIONS --- */}
                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd">Integrations</Text>
                            <Text tone="subdued">Connect external platforms to import content.</Text>

                            {accountMarkup}

                            {connected && (
                                <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                                    <InlineStack align="space-between">
                                        <BlockStack>
                                            <Text variant="bodyMd" fontWeight="bold">Daily Auto-Sync</Text>
                                            <Text variant="bodySm" tone="subdued">Automatically fetch new reels every night.</Text>
                                        </BlockStack>
                                        <Badge tone="magic">Pro Feature</Badge>
                                    </InlineStack>
                                </Box>
                            )}
                        </BlockStack>
                    </Card>
                </Layout.Section>

                {/* --- 3. BEHAVIOR --- */}
                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd">Widget Behavior</Text>
                            <Divider />

                            <Select
                                label="When customer clicks 'Add to Bag'"
                                options={[
                                    { label: 'Stay on current page (Show Toast)', value: 'ajax' },
                                    { label: 'Go to Cart Page', value: 'cart' },
                                    { label: 'Go Directly to Checkout', value: 'checkout' },
                                ]}
                                value={cartAction}
                                onChange={(val) => {
                                    setCartAction(val);
                                    handleSave(val);
                                }}
                                helpText="Choose what happens after a customer adds a product from the video."
                            />
                        </BlockStack>
                    </Card>
                </Layout.Section>

                {/* --- 4. STATUS --- */}
                <Layout.Section variant="oneThird">
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd">Installation Status</Text>
                            <Banner tone="warning" title="App Embed Disabled">
                                <p>The app widget is not active on your theme.</p>
                            </Banner>
                            <Button
                                variant="primary"
                                icon={ExternalIcon}
                                url={`https://${shop}/admin/themes/current/editor?context=apps`}
                                target="_blank"
                            >
                                Enable in Theme Editor
                            </Button>
                        </BlockStack>
                    </Card>

                    <Box paddingBlockStart="400">
                        <Card>
                            <BlockStack gap="200">
                                <Text variant="headingSm">Need Help?</Text>
                                <Link url="#">Read Documentation</Link>
                                <Link url="mailto:support@reelcart.com">Contact Support</Link>
                            </BlockStack>
                        </Card>
                    </Box>
                </Layout.Section>

            </Layout>
        </Page>
    );
}