import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import {
  Page, Layout, Card, Button, BlockStack, Box, Text,
  TextField, Divider, InlineStack, Checkbox, Banner, Select, RangeSlider,
  Grid, Icon, Badge, Tabs
} from "@shopify/polaris";

// --- 🔥 100% SAFE ICONS ---
import {
  MobileIcon,
  ColorIcon,
  TextIcon,
  SoundIcon,
  ViewIcon
} from "@shopify/polaris-icons";

import { authenticate } from "../shopify.server";
import db from "../db.server";

/* ================= LOADER ================= */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  let settings = await db.appSettings.findUnique({ where: { shop: session.shop } });

  if (!settings) {
    settings = await db.appSettings.create({ data: { shop: session.shop } });
  }
  return { settings };
};

/* ================= ACTION ================= */
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const data = {};
  for (const [key, value] of formData.entries()) {
    // 🔥 Skip system fields
    if (["createdAt", "updatedAt", "id"].includes(key)) continue;

    if (value === "true") data[key] = true;
    else if (value === "false") data[key] = false;
    // Smart number conversion
    else if (!isNaN(Number(value)) && value !== "" && !key.toLowerCase().includes("color") && !key.includes("text") && !key.includes("Heading")) {
      data[key] = Number(value);
    } else {
      data[key] = value;
    }
  }

  await db.appSettings.update({
    where: { shop: session.shop },
    data: data
  });
  return { success: true };
};

/* ================= COMPONENT ================= */
export default function AppSettingsPage() {
  const { settings } = useLoaderData();
  const fetcher = useFetcher();
  const [selectedTab, setSelectedTab] = useState(0);

  // Initialize State
  const [form, setForm] = useState({
    ...settings,
    primaryColor: settings.primaryColor || "#000000",
    buttonTextColor: settings.buttonTextColor || "#ffffff",
    buttonText: settings.buttonText || "Add to Bag",

    // Floating Defaults
    floatingSize: settings.floatingSize || 150,
    floatingPosition: settings.floatingPosition || "bottom-right",
    mobilePosition: settings.mobilePosition || "bottom-center",

    // Widget Defaults
    widgetLayout: settings.widgetLayout || "slider",
    widgetAspectRatio: settings.widgetAspectRatio || "9:16",
    cardWidth: settings.cardWidth || 250, // 🔥 New: Width Control
    widgetGap: settings.widgetGap || 16,
    widgetCornerRadius: settings.widgetCornerRadius || 12,
    widgetBackgroundColor: settings.widgetBackgroundColor || "transparent",
    cardBackgroundColor: settings.cardBackgroundColor || "#ffffff",
    sectionPadding: settings.sectionPadding || 20, // 🔥 New: Section Padding
    sectionRadius: settings.sectionRadius || 0,   // 🔥 New: Section Radius

    widgetHeading: settings.widgetHeading || "Trending Reels",
    widgetHeadingColor: settings.widgetHeadingColor || "#000000",

    // Typography
    productTitleColor: settings.productTitleColor || "#333333",
    productPriceColor: settings.productPriceColor || "#666666",
    productTextSize: settings.productTextSize || 14,

    customFont: settings.customFont || "inherit",
    buttonAnimation: settings.buttonAnimation || "none"
  });

  const [showToast, setShowToast] = useState(false);

  const handleSave = () => {
    const dataToSubmit = { ...form };
    Object.keys(dataToSubmit).forEach(key => dataToSubmit[key] = String(dataToSubmit[key]));
    fetcher.submit(dataToSubmit, { method: "post" });
    setShowToast(true);
  };

  const tabs = [
    { id: 'floating', content: 'Floating Player', accessibilityLabel: 'Floating Player Settings', panelID: 'floating-panel' },
    { id: 'widget', content: 'Home Page Widget', accessibilityLabel: 'Home Page Widget Settings', panelID: 'widget-panel' },
  ];

  /* --- HELPER: GET FLOATING POSITION --- */
  const getFloatingStyles = () => {
    const pos = form.floatingPosition;
    const style = { position: 'absolute', zIndex: 10 };

    if (pos === 'bottom-right') { style.bottom = 15; style.right = 15; }
    else if (pos === 'bottom-left') { style.bottom = 15; style.left = 15; }
    else if (pos === 'top-right') { style.top = 15; style.right = 15; }
    else if (pos === 'top-left') { style.top = 15; style.left = 15; }

    const scaleFactor = 0.7;
    style.width = `${form.floatingSize * scaleFactor}px`;
    style.height = `${(form.floatingSize * 1.6) * scaleFactor}px`;

    return style;
  };

  /* --- RENDER: FLOATING PLAYER TAB --- */
  const renderFloatingSettings = () => (
    <BlockStack gap="500">
      <Card>
        <BlockStack gap="400">
          <InlineStack gap="200" align="start"><Icon source={MobileIcon} /><Text variant="headingMd">Placement & Mobile</Text></InlineStack>
          <Divider />
          <Checkbox label="Enable Floating Player" checked={form.floatingPlayerVisible} onChange={(v) => setForm({ ...form, floatingPlayerVisible: v })} />
          <Checkbox label="Hide on Mobile" checked={form.hideOnMobile} onChange={(v) => setForm({ ...form, hideOnMobile: v })} />
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6 }}><Select label="Desktop Position" options={[{ label: 'Bottom Right', value: 'bottom-right' }, { label: 'Bottom Left', value: 'bottom-left' }, { label: 'Top Right', value: 'top-right' }, { label: 'Top Left', value: 'top-left' }]} value={form.floatingPosition} onChange={(v) => setForm({ ...form, floatingPosition: v })} /></Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6 }}><Select label="Mobile Position" options={[{ label: 'Bottom Center', value: 'bottom-center' }, { label: 'Top Center', value: 'top-center' }]} value={form.mobilePosition} onChange={(v) => setForm({ ...form, mobilePosition: v })} disabled={form.hideOnMobile} /></Grid.Cell>
          </Grid>
        </BlockStack>
      </Card>
      <Card>
        <BlockStack gap="400">
          <InlineStack gap="200" align="start"><Icon source={ColorIcon} /><Text variant="headingMd">Design & Style</Text></InlineStack>
          <Divider />
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6 }}><RangeSlider label="Player Size (px)" value={form.floatingSize} onChange={(v) => setForm({ ...form, floatingSize: v })} min={100} max={250} output /></Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6 }}><RangeSlider label="Border Radius" value={form.borderRadius} onChange={(v) => setForm({ ...form, borderRadius: v })} min={0} max={30} output /></Grid.Cell>
          </Grid>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6 }}><TextField label="Border Color" value={form.floatingBorderColor} onChange={(v) => setForm({ ...form, floatingBorderColor: v })} prefix={<div style={{ width: 15, height: 15, background: form.floatingBorderColor, borderRadius: 3 }} />} autoComplete="off" /></Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6 }}><RangeSlider label="Border Width" value={form.floatingBorderWidth} onChange={(v) => setForm({ ...form, floatingBorderWidth: v })} min={0} max={10} output /></Grid.Cell>
          </Grid>
          <Checkbox label="Enable Shadow" checked={form.enableShadow} onChange={(v) => setForm({ ...form, enableShadow: v })} />
          <TextField label="Overlay Text" value={form.floatingOverlayText} onChange={(v) => setForm({ ...form, floatingOverlayText: v })} autoComplete="off" />
        </BlockStack>
      </Card>
      <Card>
        <BlockStack gap="400">
          <InlineStack gap="200" align="start"><Icon source={SoundIcon} /><Text variant="headingMd">Behavior</Text></InlineStack>
          <Divider />
          <Checkbox label="Start Muted" checked={form.startMuted} onChange={(v) => setForm({ ...form, startMuted: v })} />
          <Checkbox label="Minimize on Close" checked={form.minimizeOnClose} onChange={(v) => setForm({ ...form, minimizeOnClose: v })} helpText="If disabled, player closes completely." />
        </BlockStack>
      </Card>
    </BlockStack>
  );

  /* --- RENDER: HOME WIDGET TAB --- */
  const renderWidgetSettings = () => (
    <BlockStack gap="500">
      <Card>
        <BlockStack gap="400">
          <InlineStack gap="200" align="start"><Icon source={ViewIcon} /><Text variant="headingMd">Layout & Sizing</Text></InlineStack>
          <Divider />
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6 }}><Select label="Display Mode" options={[{ label: 'Slider (Carousel)', value: 'slider' }, { label: 'Grid (Rows)', value: 'grid' }]} value={form.widgetLayout} onChange={(v) => setForm({ ...form, widgetLayout: v })} /></Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6 }}><Select label="Card Shape (Video Aspect)" options={[{ label: 'Portrait (9:16)', value: '9:16' }, { label: 'Square (1:1)', value: '1:1' }]} value={form.widgetAspectRatio} onChange={(v) => setForm({ ...form, widgetAspectRatio: v })} /></Grid.Cell>
          </Grid>
          {/* 🔥 WIDTH CONTROL ADDED */}
          <RangeSlider label="Reel Card Width (px)" value={form.cardWidth} onChange={(v) => setForm({ ...form, cardWidth: v })} min={150} max={400} output helpText="Height adjusts automatically based on aspect ratio." />
          <RangeSlider label="Gap Between Cards (px)" value={form.widgetGap} onChange={(v) => setForm({ ...form, widgetGap: v })} min={0} max={40} output />
        </BlockStack>
      </Card>
      <Card>
        <BlockStack gap="400">
          <InlineStack gap="200" align="start"><Icon source={ColorIcon} /><Text variant="headingMd">Colors & Backgrounds</Text></InlineStack>
          <Divider />
          <Text variant="headingSm">Section Styling</Text>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6 }}><TextField label="Section Background" value={form.widgetBackgroundColor} onChange={(v) => setForm({ ...form, widgetBackgroundColor: v })} prefix={<div style={{ width: 15, height: 15, background: form.widgetBackgroundColor, borderRadius: 3 }} />} autoComplete="off" helpText="Transparent for website default." /></Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6 }}><TextField label="Product Info Background" value={form.cardBackgroundColor} onChange={(v) => setForm({ ...form, cardBackgroundColor: v })} prefix={<div style={{ width: 15, height: 15, background: form.cardBackgroundColor, borderRadius: 3, border: '1px solid #ccc' }} />} autoComplete="off" helpText="Background for the bottom info box." /></Grid.Cell>
          </Grid>
          {/* 🔥 SECTION PADDING & RADIUS ADDED */}
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6 }}><RangeSlider label="Section Padding (px)" value={form.sectionPadding} onChange={(v) => setForm({ ...form, sectionPadding: v })} min={0} max={100} output /></Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6 }}><RangeSlider label="Section Radius (px)" value={form.sectionRadius} onChange={(v) => setForm({ ...form, sectionRadius: v })} min={0} max={50} output /></Grid.Cell>
          </Grid>
          <RangeSlider label="Card Corner Radius" value={form.widgetCornerRadius} onChange={(v) => setForm({ ...form, widgetCornerRadius: v })} min={0} max={30} output />

          <Divider />
          <Text variant="headingSm">Text Colors</Text>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 4 }}><TextField label="Heading Color" value={form.widgetHeadingColor} onChange={(v) => setForm({ ...form, widgetHeadingColor: v })} prefix={<div style={{ width: 15, height: 15, background: form.widgetHeadingColor, borderRadius: 3 }} />} autoComplete="off" /></Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 4 }}><TextField label="Title Color" value={form.productTitleColor} onChange={(v) => setForm({ ...form, productTitleColor: v })} prefix={<div style={{ width: 15, height: 15, background: form.productTitleColor, borderRadius: 3 }} />} autoComplete="off" /></Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 4 }}><TextField label="Price Color" value={form.productPriceColor} onChange={(v) => setForm({ ...form, productPriceColor: v })} prefix={<div style={{ width: 15, height: 15, background: form.productPriceColor, borderRadius: 3 }} />} autoComplete="off" /></Grid.Cell>
          </Grid>
        </BlockStack>
      </Card>
      <Card>
        <BlockStack gap="400">
          <InlineStack gap="200" align="start"><Icon source={TextIcon} /><Text variant="headingMd">Typography & Content</Text></InlineStack>
          <Divider />
          <TextField label="Section Heading" value={form.widgetHeading} onChange={(v) => setForm({ ...form, widgetHeading: v })} autoComplete="off" />
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6 }}><RangeSlider label="Product Text Size (px)" value={form.productTextSize} onChange={(v) => setForm({ ...form, productTextSize: v })} min={10} max={24} output /></Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6 }}><div style={{ marginTop: '28px' }}><Checkbox label="Show Product Details" checked={form.showProductDetails} onChange={(v) => setForm({ ...form, showProductDetails: v })} /></div></Grid.Cell>
          </Grid>
        </BlockStack>
      </Card>
    </BlockStack>
  );

  return (
    <Page title="App Customization" subtitle="Customize Floating Player & Home Widget." primaryAction={{ content: "Save Changes", loading: fetcher.state === "submitting", onAction: handleSave }}>
      <Layout>
        <Layout.Section>
          {showToast && fetcher.data?.success && <Box paddingBlockEnd="400"><Banner title="Saved Successfully!" tone="success" onDismiss={() => setShowToast(false)} /></Box>}

          <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
            <Box paddingBlockStart="400">
              {selectedTab === 0 ? renderFloatingSettings() : renderWidgetSettings()}
            </Box>
          </Tabs>

          <Box paddingBlockStart="500">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd">Global Button Styling</Text>
                <Divider />
                <Grid>
                  <Grid.Cell columnSpan={{ xs: 6 }}><TextField label="Button Text" value={form.buttonText} onChange={(v) => setForm({ ...form, buttonText: v })} autoComplete="off" /></Grid.Cell>
                  <Grid.Cell columnSpan={{ xs: 6 }}><Select label="Button Animation" options={[{ label: 'None', value: 'none' }, { label: 'Pulse', value: 'pulse' }]} value={form.buttonAnimation} onChange={(v) => setForm({ ...form, buttonAnimation: v })} /></Grid.Cell>
                </Grid>
                <Grid>
                  <Grid.Cell columnSpan={{ xs: 6 }}><TextField label="Button Background Color" value={form.primaryColor} onChange={(v) => setForm({ ...form, primaryColor: v })} prefix={<div style={{ width: 15, height: 15, background: form.primaryColor, borderRadius: 3 }} />} autoComplete="off" /></Grid.Cell>
                  <Grid.Cell columnSpan={{ xs: 6 }}><TextField label="Button Text Color" value={form.buttonTextColor} onChange={(v) => setForm({ ...form, buttonTextColor: v })} prefix={<div style={{ width: 15, height: 15, background: form.buttonTextColor, borderRadius: 3 }} />} autoComplete="off" /></Grid.Cell>
                </Grid>
              </BlockStack>
            </Card>
          </Box>
        </Layout.Section>

        {/* --- 🔥 PREVIEW: REAL-TIME UPDATES & DYNAMIC WIDTH --- */}
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingSm">Live Preview: {selectedTab === 0 ? "Floating Player" : "Home Widget"}</Text>

              <div style={{
                background: selectedTab === 0 ? '#f1f2f3' : '#f4f4f4', // Base Preview BG
                border: '1px solid #e3e3e3',
                borderRadius: '16px',
                height: '550px',
                width: '100%',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)'
              }}>
                <div style={{ height: '24px', background: 'rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', padding: '0 10px', alignItems: 'center', fontSize: '10px', color: '#999' }}>
                  <span>9:41</span>
                  <span>📶 🔋</span>
                </div>

                <div style={{ flex: 1, position: 'relative', overflowY: 'auto', padding: '0' }}>

                  {selectedTab === 0 ? (
                    // --- FLOATING PREVIEW ---
                    <>
                      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', opacity: 0.3 }}>
                        <div style={{ height: '150px', background: '#ddd', borderRadius: '8px' }}></div>
                        <div style={{ height: '20px', width: '60%', background: '#ddd', borderRadius: '4px' }}></div>
                        <div style={{ height: '20px', width: '90%', background: '#ddd', borderRadius: '4px' }}></div>
                        <div style={{ height: '200px', background: '#ddd', borderRadius: '8px' }}></div>
                      </div>

                      <div style={{
                        ...getFloatingStyles(),
                        background: '#222',
                        borderRadius: `${form.borderRadius}px`,
                        border: `${form.floatingBorderWidth}px ${form.borderStyle} ${form.floatingBorderColor}`,
                        boxShadow: form.enableShadow ? '0 10px 30px rgba(0,0,0,0.4)' : 'none',
                        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden'
                      }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>
                        {form.showSaleBadge && <div style={{ position: 'absolute', top: 8, left: 8, background: '#ff0000', color: 'white', fontSize: 9, padding: '2px 5px', borderRadius: 3, zIndex: 2 }}>SALE</div>}
                        <div style={{ padding: 8, zIndex: 2, textAlign: 'center' }}>
                          <div style={{ color: 'white', fontSize: 10, marginBottom: 5 }}>{form.floatingOverlayText}</div>
                          <div style={{ background: form.primaryColor, color: form.buttonTextColor, fontSize: 10, padding: '5px', borderRadius: 4, fontWeight: 'bold', animation: form.buttonAnimation === 'pulse' ? 'pulse 2s infinite' : 'none' }}>{form.buttonText}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    // --- WIDGET PREVIEW (SECTION STYLING APPLIED) ---
                    <div style={{
                      // Section Styling Mockup
                      background: form.widgetBackgroundColor === 'transparent' ? 'transparent' : form.widgetBackgroundColor,
                      padding: `${form.sectionPadding}px`,
                      borderRadius: `${form.sectionRadius}px`,
                      minHeight: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <h3 style={{ color: form.widgetHeadingColor, marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}>{form.widgetHeading}</h3>

                      <div style={{
                        display: 'grid',
                        // Scale down width slightly for preview to fit phone screen
                        gridTemplateColumns: `repeat(auto-fill, minmax(${form.cardWidth * 0.7}px, 1fr))`,
                        gap: `${form.widgetGap}px`,
                      }}>
                        {[1, 2, 3].map((i) => (
                          <div key={i} style={{
                            background: 'transparent',
                            borderRadius: `${form.widgetCornerRadius}px`,
                            overflow: 'hidden',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                            border: '1px solid #eee'
                          }}>
                            {/* VIDEO HALF */}
                            <div style={{
                              aspectRatio: form.widgetAspectRatio === '1:1' ? '1 / 1' : '9 / 16',
                              background: '#000',
                              position: 'relative'
                            }}>
                              <div style={{ position: 'absolute', inset: 0, background: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>VIDEO</div>
                              {/* Top Icons - Scaled based on card width logic */}
                              <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: `${Math.max(9, form.cardWidth * 0.04)}px`, padding: '2px 6px', borderRadius: '10px' }}>👁️ 2k ⭐ 4.8</div>
                              <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, color: 'white', fontSize: '12px' }}>🔇</div>
                              <div style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 2, background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.5)', color: 'white', fontSize: '9px', padding: '4px 8px', borderRadius: '12px' }}>🛍️ View</div>
                            </div>

                            {/* INFO HALF - 🔥 Color Applied Here */}
                            <div style={{
                              padding: '10px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              textAlign: 'left',
                              background: form.cardBackgroundColor || '#fff'
                            }}>
                              {form.showProductDetails && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: 32, height: 32, background: '#eee', borderRadius: 4 }}></div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ color: form.productTitleColor, fontSize: `${form.productTextSize}px`, fontWeight: 'bold', lineHeight: 1.1 }}>T-Shirt</div>
                                    <div style={{ color: form.productPriceColor, fontSize: `${form.productTextSize - 2}px` }}>$29.00</div>
                                  </div>
                                  <div style={{ fontSize: '14px', color: form.productTitleColor }}>♡</div>
                                </div>
                              )}

                              <div style={{
                                background: form.primaryColor, color: form.buttonTextColor,
                                textAlign: 'center', padding: '8px', borderRadius: 6, fontSize: '11px', fontWeight: 'bold',
                                animation: form.buttonAnimation === 'pulse' ? 'pulse 2s infinite' : 'none'
                              }}>
                                {form.buttonText}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}