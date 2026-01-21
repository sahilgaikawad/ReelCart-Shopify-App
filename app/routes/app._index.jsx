import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import {
  Page, Layout, Card, Button, BlockStack, Box, Text, AppProvider,
  ProgressBar, Banner, Divider, InlineStack, Badge
} from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import { authenticate } from "../shopify.server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { UploadIcon, NoteIcon } from "@shopify/polaris-icons";
import db from "../db.server";

import "@shopify/polaris/build/esm/styles.css";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // --- INSTAGRAM SYNC LOGIC (Isme Random rakha hai, kyunki Insta pe pehle se views hote hain) ---
  if (intent === "sync_instagram") {
    try {
      const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
      if (!accessToken) return { error: "Instagram token not found in .env" };

      const response = await fetch(
        `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${accessToken}`
      );
      const json = await response.json();

      if (json.data) {
        const reels = json.data.filter(item => item.media_type === "VIDEO");

        for (const reel of reels) {
          await db.reel.upsert({
            where: { instagramId: reel.id },
            update: {
              videoUrl: reel.media_url,
              productImage: reel.thumbnail_url || reel.media_url,
            },
            create: {
              shop: session.shop,
              instagramId: reel.id,
              videoUrl: reel.media_url,
              productImage: reel.thumbnail_url || reel.media_url,
              productTitle: reel.caption ? reel.caption.substring(0, 40) : "Instagram Reel",
              source: "instagram",

              // Insta Sync ke liye fake data thik hai taaki viral lage
              views: 0,
              boostViews: Math.floor(Math.random() * (5000 - 1000) + 1000),
              likes: Math.floor(Math.random() * (500 - 50) + 50),
              rating: "4.8"
            },
          });
        }
        return { success: true, count: reels.length, type: "sync" };
      }
      return { error: "No reels found in your Instagram account." };
    } catch (err) {
      return { error: "Failed to connect to Instagram API." };
    }
  }

  // --- SAVE REEL LOGIC (MANUAL UPLOAD) ---
  if (intent === "save_reel") {
    let finalVideoUrl = formData.get("videoUrl");
    const productTitle = formData.get("productTitle");

    const fileResponse = await admin.graphql(
      `#graphql
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files { ... on Video { id } }
        }
      }`,
      { variables: { files: [{ alt: productTitle, contentType: "VIDEO", originalSource: finalVideoUrl }] } }
    );

    const fileData = await fileResponse.json();
    const videoId = fileData.data?.fileCreate?.files[0]?.id;

    if (videoId) {
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const checkFile = await admin.graphql(
          `#graphql
          query getFile($id: ID!) {
            node(id: $id) { ... on Video { sources { url } } }
          }`,
          { variables: { id: videoId } }
        );
        const checkData = await checkFile.json();
        const cdnLink = checkData.data?.node?.sources?.find(s => s.url.includes('cdn.shopify.com'))?.url;
        if (cdnLink) {
          finalVideoUrl = cdnLink;
          break;
        }
      }
    }

    await db.reel.create({
      data: {
        shop: session.shop,
        videoUrl: finalVideoUrl,
        productId: formData.get("productId"),
        variantId: formData.get("variantId"),
        productHandle: formData.get("productHandle"),
        productTitle: productTitle,
        productImage: formData.get("productImage"),
        price: formData.get("price") || "0",
        comparePrice: formData.get("comparePrice") || "0",
        source: "manual",
        instagramUrl: "",

        // --- 🔥 FIXED: MANUAL UPLOAD STRICTLY 0 ---
        views: 0,       // Actual Views
        boostViews: 0,  // No Fake Views initially
        likes: 0,       // No Fake Likes initially
        rating: "5.0"   // Default rating
      },
    });
    return { success: true, type: "save" };
  }

  // --- STAGED UPLOAD LOGIC ---
  if (intent === "get_staged_url") {
    const response = await admin.graphql(
      `#graphql
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets { url resourceUrl parameters { name value } }
        }
      }`,
      { variables: { input: [{ filename: formData.get("filename"), fileSize: formData.get("filesize"), mimeType: formData.get("filetype"), resource: "VIDEO" }] } }
    );
    const resJson = await response.json();
    return { stagedTarget: resJson.data.stagedUploadsCreate.stagedTargets[0] };
  }
  return null;
};

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const isPublishing = fetcher.state !== "idle" && fetcher.formData?.get("intent") === "save_reel";
  const isSyncing = fetcher.state !== "idle" && fetcher.formData?.get("intent") === "sync_instagram";

  useEffect(() => {
    if (fetcher.data?.success) {
      if (fetcher.data.type === "sync") {
        shopify.toast.show(`Synced ${fetcher.data.count} reels!`);
      } else {
        shopify.toast.show("Reel published successfully!");
        setShowSuccess(true);
        setVideoUrl("");
        setSelectedProduct(null);
        setCurrentFile(null);
        setProgress(0);
        setTimeout(() => setShowSuccess(false), 5000);
      }
    }
    if (fetcher.data?.error) {
      shopify.toast.show(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data, shopify]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setCurrentFile(file);
    setUploading(true);
    setProgress(15);
    const formData = new FormData();
    formData.append("intent", "get_staged_url");
    formData.append("filename", file.name);
    formData.append("filesize", file.size.toString());
    formData.append("filetype", file.type);
    fetcher.submit(formData, { method: "POST" });
  };

  useEffect(() => {
    if (fetcher.data?.stagedTarget && uploading && currentFile) {
      const uploadFile = async () => {
        const { url, parameters, resourceUrl } = fetcher.data.stagedTarget;
        const uploadFormData = new FormData();
        parameters.forEach(({ name, value }) => uploadFormData.append(name, value));
        uploadFormData.append("file", currentFile);

        try {
          const response = await fetch(url, { method: "POST", body: uploadFormData });
          if (response.ok) {
            setVideoUrl(resourceUrl);
            setUploading(false);
            setProgress(100);
            shopify.toast.show("Video uploaded!");
          }
        } catch (e) {
          setUploading(false);
          shopify.toast.show("Upload failed", { isError: true });
        }
      };
      uploadFile();
    }
  }, [fetcher.data, uploading, currentFile, shopify]);

  const handleSelectProduct = async () => {
    const sel = await shopify.resourcePicker({ type: "product", multiple: false });
    if (sel && sel.length > 0) {
      const product = sel[0];
      const variant = product.variants[0];
      setSelectedProduct({
        id: product.id,
        title: product.title,
        handle: product.handle,
        image: product.images[0]?.originalSrc,
        variantId: variant.id.split("/").pop(),
        price: variant.price,
        comparePrice: variant.compareAtPrice || "0"
      });
    }
  };

  return (
    <AppProvider i18n={enTranslations}>
      <Page title="Reel Dashboard" primaryAction={{ content: 'Manage Library', url: '/app/manage' }}>
        <Layout>
          <Layout.Section>
            {showSuccess && (
              <Box paddingBlockEnd="400">
                <Banner title="Reel Published Successfully!" tone="success" onDismiss={() => setShowSuccess(false)}>
                  <p>Your video is now live. Stats are set to 0 (Actual).</p>
                </Banner>
              </Box>
            )}

            <Banner title="Welcome to ReelCart!" tone="info">
              <p>Start by syncing your Instagram reels or upload a video manually.</p>
            </Banner>
          </Layout.Section>

          <Layout.Section>
            <Card padding="500">
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <BlockStack gap="100">
                    <Text variant="headingMd">Instagram Auto-Sync</Text>
                    <Text tone="subdued">Sync reels directly from your connected Instagram account.</Text>
                  </BlockStack>
                  <Badge tone="info">API Connected</Badge>
                </InlineStack>
                <Box paddingBlockStart="200">
                  <Button variant="primary" icon={NoteIcon} loading={isSyncing} onClick={() => fetcher.submit({ intent: "sync_instagram" }, { method: "POST" })}>
                    Sync Reels from Instagram
                  </Button>
                </Box>
              </BlockStack>
            </Card>

            <Box paddingBlock="400"><div style={{ textAlign: 'center', opacity: 0.5 }}>- OR -</div></Box>

            <Card padding="500">
              <BlockStack gap="500">
                <Text variant="headingMd">Add New Reel Manually</Text>
                <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                  <div style={{ border: '2px dashed #ccc', padding: '30px', textAlign: 'center', borderRadius: '8px', background: '#fff' }}>
                    <input type="file" id="fileInput" hidden onChange={handleFileUpload} accept="video/*" />
                    <BlockStack gap="200" align="center">
                      <Button icon={UploadIcon} onClick={() => document.getElementById('fileInput').click()} disabled={uploading || isPublishing} size="large">
                        {videoUrl ? "Change Video File" : "Choose Video File"}
                      </Button>
                      <Text tone="subdued" variant="bodyXs">MP4 format recommended</Text>
                    </BlockStack>
                    {uploading && <Box paddingBlockStart="300"><ProgressBar progress={progress} tone="primary" /></Box>}
                    {videoUrl && <Box paddingBlockStart="300"><Text tone="success" fontWeight="bold">✓ Video Uploaded</Text></Box>}
                  </div>
                </Box>

                <Box borderBlockStartWidth="1" borderColor="border" paddingBlockStart="400">
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="bodyMd" fontWeight="bold">Tagged Product:</Text>
                      <Button onClick={handleSelectProduct}>{selectedProduct ? "Change Product" : "Select Product"}</Button>
                    </InlineStack>
                    {selectedProduct ? (
                      <InlineStack gap="300" blockAlign="center">
                        {selectedProduct.image && <img src={selectedProduct.image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />}
                        <BlockStack gap="100">
                          <Text fontWeight="bold">{selectedProduct.title}</Text>
                          <Badge tone="success">Linked</Badge>
                        </BlockStack>
                      </InlineStack>
                    ) : (
                      <Text tone="subdued" variant="bodySm">No product linked yet.</Text>
                    )}
                  </BlockStack>
                </Box>

                <Button variant="primary" fullWidth size="large" loading={isPublishing} disabled={!videoUrl || !selectedProduct || isPublishing} onClick={() => {
                  fetcher.submit({
                    intent: "save_reel", videoUrl: videoUrl, source: "manual",
                    productTitle: selectedProduct.title, productId: selectedProduct.id,
                    variantId: selectedProduct.variantId, productHandle: selectedProduct.handle,
                    productImage: selectedProduct.image, price: selectedProduct.price,
                    comparePrice: selectedProduct.comparePrice,
                  }, { method: "POST" });
                }}>
                  Publish Reel to Widget
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppProvider>
  );
}