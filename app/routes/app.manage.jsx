import { useState, useEffect, useCallback } from "react";
import { useLoaderData, useFetcher, useSearchParams, useNavigate } from "react-router";
import {
    AppProvider, Page, Layout, Card, Button, BlockStack, Box, Text,
    Modal, TextField, Divider, InlineStack, Badge, Grid, Tabs, Pagination, Select,
    Thumbnail, Checkbox, Tooltip, EmptyState, Icon
} from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
// Icons
import {
    DeleteIcon, ViewIcon, LinkIcon, HideIcon, EditIcon, ExternalIcon,
    SearchIcon, PlusIcon, PlayIcon, RefreshIcon // Added RefreshIcon for Sync
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { useAppBridge } from "@shopify/app-bridge-react";
import db from "../db.server";
import "@shopify/polaris/build/esm/styles.css";

/* ================= LOADER ================= */
export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const url = new URL(request.url);

    const page = parseInt(url.searchParams.get("page") || "1");
    const currentTab = url.searchParams.get("tab") || "all";
    const sortParam = url.searchParams.get("sort") || "newest";
    const query = url.searchParams.get("q") || ""; // Search Query
    const pageSize = 12;

    // 1. FILTER LOGIC
    let whereClause = {
        shop: session.shop,
        productTitle: { contains: query }
    };

    if (currentTab === "live") whereClause.isLive = true;
    if (currentTab === "hidden") whereClause.isLive = false;
    if (currentTab === "instagram") whereClause.source = "instagram";
    if (currentTab === "manual") whereClause.source = "manual";

    // 2. SORT LOGIC
    let orderBy = { createdAt: "desc" };
    if (sortParam === "views_desc") orderBy = { views: "desc" };
    if (sortParam === "likes_desc") orderBy = { likes: "desc" };
    if (sortParam === "oldest") orderBy = { createdAt: "asc" };

    const reels = await db.reel.findMany({
        where: whereClause, orderBy: orderBy, skip: (page - 1) * pageSize, take: pageSize,
    });

    const totalCount = await db.reel.count({ where: whereClause });

    const serializedReels = reels.map(reel => ({
        ...reel,
        createdAt: reel.createdAt.toISOString().split('T')[0],
        displayViews: (reel.views || 0) + (reel.boostViews || 0) // Total for UI
    }));

    return {
        reels: serializedReels, page, totalPages: Math.ceil(totalCount / pageSize), totalItems: totalCount,
        currentTab, sortParam, query, shopDomain: session.shop
    };
};

/* ================= ACTION ================= */
export const action = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "toggle_live") {
        await db.reel.update({ where: { id: Number(formData.get("id")) }, data: { isLive: formData.get("isLive") === "false" } });
        return { success: true };
    }
    if (intent === "link_product") {
        await db.reel.update({
            where: { id: Number(formData.get("id")) },
            data: {
                productId: formData.get("productId"), productHandle: formData.get("productHandle"),
                productTitle: formData.get("productTitle"), productImage: formData.get("productImage"),
                variantId: formData.get("variantId"), price: formData.get("price"), comparePrice: formData.get("comparePrice"),
            },
        });
        return { success: true };
    }
    if (intent === "delete") {
        await db.reel.delete({ where: { id: Number(formData.get("id")) } });
        return { success: true };
    }
    if (intent === "bulk_delete") {
        const ids = JSON.parse(formData.get("ids")).map(Number);
        await db.reel.deleteMany({ where: { id: { in: ids } } });
        return { success: true };
    }
    if (intent === "bulk_status") {
        const ids = JSON.parse(formData.get("ids")).map(Number);
        await db.reel.updateMany({ where: { id: { in: ids } }, data: { isLive: formData.get("status") === "true" } });
        return { success: true };
    }
    if (intent === "edit") {
        await db.reel.update({
            where: { id: Number(formData.get("id")) },
            data: {
                productTitle: formData.get("title"),
                boostViews: Number(formData.get("boostViews")),
                likes: Number(formData.get("likes")),
            },
        });
        return { success: true };
    }

    // --- INSTAGRAM SYNC LOGIC ---
    if (intent === "sync_instagram") {
        try {
            const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
            if (!accessToken) return { error: "Access Token missing" };

            const response = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${accessToken}`);
            const json = await response.json();

            if (json.data) {
                const batch = json.data.filter(item => item.media_type === "VIDEO");
                for (const reel of batch) {
                    await db.reel.upsert({
                        where: { instagramId: reel.id },
                        update: { videoUrl: reel.media_url },
                        create: {
                            shop: session.shop, instagramId: reel.id, videoUrl: reel.media_url,
                            productImage: reel.thumbnail_url || reel.media_url,
                            productTitle: reel.caption ? reel.caption.substring(0, 40) : "Instagram Reel",
                            source: "instagram",
                            // Default stats for synced reels
                            views: 0,
                            boostViews: Math.floor(Math.random() * (5000 - 1000) + 1000),
                            likes: Math.floor(Math.random() * (500 - 50) + 50),
                            rating: "4.8"
                        },
                    });
                }
                return { success: true, type: "sync" };
            }
            return { error: "No reels found" };
        } catch (error) { return { error: error.message }; }
    }

    return null;
};

/* ================= COMPONENT ================= */
export default function ManageReels() {
    const { reels, currentPage, totalPages, totalItems, currentTab, sortParam, query, shopDomain } = useLoaderData();
    const [searchParams, setSearchParams] = useSearchParams();
    const fetcher = useFetcher();
    const shopify = useAppBridge();
    const navigate = useNavigate();

    // UI States
    const [activeModal, setActiveModal] = useState(false);
    const [previewVideo, setPreviewVideo] = useState(null);
    const [editingReel, setEditingReel] = useState({ id: "", title: "", views: 0, boostViews: 0, likes: 0 });
    const [sortValue, setSortValue] = useState(sortParam);
    const [searchValue, setSearchValue] = useState(query);

    // Selection
    const [selectedResources, setSelectedResources] = useState([]);
    const [selectionMode, setSelectionMode] = useState(false);

    const tabs = [
        { id: 'all', content: 'All' },
        { id: 'live', content: 'Live' },
        { id: 'hidden', content: 'Hidden' },
        { id: 'instagram', content: 'Instagram' },
        { id: 'manual', content: 'Uploaded' },
    ];

    // --- HANDLERS ---
    const handleTabChange = (index) => { setSearchParams({ tab: tabs[index].id, page: "1", sort: sortValue, q: searchValue }); setSelectedResources([]); };
    const handleSortChange = (value) => { setSortValue(value); setSearchParams({ tab: currentTab, page: "1", sort: value, q: searchValue }); };

    const handleSearchSubmit = () => setSearchParams({ tab: currentTab, page: "1", sort: sortValue, q: searchValue });

    const handleSelectionChange = (id) => {
        if (selectedResources.includes(id)) setSelectedResources(selectedResources.filter(item => item !== id));
        else setSelectedResources([...selectedResources, id]);
    };

    const executeBulkAction = (actionType) => {
        if (selectedResources.length === 0) return;
        if (actionType === 'delete') {
            if (!confirm(`Delete ${selectedResources.length} items?`)) return;
            fetcher.submit({ intent: 'bulk_delete', ids: JSON.stringify(selectedResources) }, { method: 'post' });
        } else if (actionType === 'publish') {
            fetcher.submit({ intent: 'bulk_status', ids: JSON.stringify(selectedResources), status: 'true' }, { method: 'post' });
        } else if (actionType === 'hide') {
            fetcher.submit({ intent: 'bulk_status', ids: JSON.stringify(selectedResources), status: 'false' }, { method: 'post' });
        }
        setSelectionMode(false); setSelectedResources([]);
    };

    const handleLinkProduct = async (reelId) => {
        const selected = await shopify.resourcePicker({ type: "product", multiple: false });
        if (selected && selected.length > 0) {
            const p = selected[0]; const v = p.variants[0];
            fetcher.submit({
                intent: "link_product", id: reelId, productId: p.id, productHandle: p.handle, productTitle: p.title,
                productImage: p.images[0]?.originalSrc || "", variantId: v.id.split("/").pop(), price: v.price, comparePrice: v.compareAtPrice || "0"
            }, { method: "post" });
        }
    };

    useEffect(() => { if (fetcher.data?.success) shopify.toast.show("Updated successfully"); }, [fetcher.data]);

    return (
        <AppProvider i18n={enTranslations}>
            <Page
                title="Manage Reels"
                subtitle={`${totalItems} videos`}
                primaryAction={{
                    content: selectionMode ? "Cancel Selection" : "Select Videos",
                    onAction: () => setSelectionMode(!selectionMode),
                    variant: selectionMode ? "tertiary" : "secondary"
                }}
                secondaryActions={[
                    {
                        content: "Sync Instagram",
                        icon: RefreshIcon,
                        onAction: () => fetcher.submit({ intent: "sync_instagram" }, { method: "post" }),
                        loading: fetcher.state !== "idle" && fetcher.formData?.get("intent") === "sync_instagram"
                    },
                    {
                        content: "Add New Video",
                        icon: PlusIcon,
                        onAction: () => navigate("/app")
                    }
                ]}
            >
                <Tabs tabs={tabs} selected={tabs.findIndex(t => t.id === currentTab)} onSelect={handleTabChange}>
                    <Box paddingBlockStart="400">

                        <Box paddingBlockEnd="400">
                            <InlineStack align="space-between" blockAlign="center" gap="400">
                                <div style={{ flex: 1 }}>
                                    <TextField
                                        label="Search"
                                        labelHidden
                                        placeholder="Search by title..."
                                        value={searchValue}
                                        onChange={setSearchValue}
                                        onBlur={handleSearchSubmit}
                                        prefix={<Icon source={SearchIcon} />}
                                        autoComplete="off"
                                    />
                                </div>

                                <InlineStack gap="300">
                                    {selectionMode && selectedResources.length > 0 && (
                                        <>
                                            <Badge tone="info">{selectedResources.length} Selected</Badge>
                                            <Button size="slim" onClick={() => executeBulkAction('publish')}>Set Live</Button>
                                            <Button size="slim" onClick={() => executeBulkAction('hide')}>Set Hidden</Button>
                                            <Button size="slim" tone="critical" onClick={() => executeBulkAction('delete')}>Delete</Button>
                                        </>
                                    )}
                                    <div style={{ width: '150px' }}>
                                        <Select label="Sort" labelHidden options={[{ label: 'Newest', value: 'newest' }, { label: 'Views (High)', value: 'views_desc' }, { label: 'Likes (High)', value: 'likes_desc' }]} value={sortValue} onChange={handleSortChange} />
                                    </div>
                                </InlineStack>
                            </InlineStack>
                        </Box>

                        {reels.length > 0 ? (
                            <Grid>
                                {reels.map((reel) => (
                                    <Grid.Cell key={reel.id} columnSpan={{ xs: 6, sm: 6, md: 3, lg: 3 }}>
                                        <div style={{ position: 'relative', opacity: selectionMode && !selectedResources.includes(reel.id) ? 0.6 : 1 }}>
                                            {selectionMode && <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}><Checkbox labelHidden checked={selectedResources.includes(reel.id)} onChange={() => handleSelectionChange(reel.id)} /></div>}

                                            <Card padding="0">
                                                <div
                                                    style={{ position: 'relative', height: '280px', background: '#000', borderRadius: '8px 8px 0 0', overflow: 'hidden', cursor: 'pointer' }}
                                                    onClick={() => !selectionMode && setPreviewVideo(reel.videoUrl)}
                                                >
                                                    <video style={{ width: '100%', height: '100%', objectFit: 'cover' }} src={reel.videoUrl} muted onMouseOver={(e) => e.target.play()} onMouseOut={(e) => e.target.pause()} />
                                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '10px', pointerEvents: 'none' }}>
                                                        <Icon source={PlayIcon} tone="textInverse" />
                                                    </div>
                                                    <div style={{ position: 'absolute', top: '10px', left: '10px' }}><Badge tone={reel.isLive ? "success" : "attention"}>{reel.isLive ? "● LIVE" : "HIDDEN"}</Badge></div>
                                                    <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '10px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
                                                        <BlockStack gap="100">
                                                            <InlineStack gap="200"><Badge tone="info" size="small">{reel.displayViews} Views</Badge><Badge tone="magic" size="small">{reel.likes} Likes</Badge></InlineStack>
                                                            <Text variant="bodyXs" tone="textInverse">({reel.views} Real + {reel.boostViews} Boost)</Text>
                                                        </BlockStack>
                                                    </div>
                                                </div>

                                                <Box padding="300">
                                                    <BlockStack gap="300">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f1f1', paddingBottom: '8px' }}>
                                                            {reel.productImage ? <Thumbnail source={reel.productImage} size="small" alt="" /> : <div style={{ width: 30, height: 30, background: '#eee', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>?</div>}
                                                            <div style={{ flex: 1, overflow: 'hidden' }}><Text variant="bodySm" fontWeight="bold" truncate>{reel.productTitle || "No Product"}</Text></div>
                                                            {reel.productHandle && <Tooltip content="View on Store"><Button icon={ExternalIcon} variant="plain" url={`https://${shopDomain}/products/${reel.productHandle}`} target="_blank" /></Tooltip>}
                                                        </div>
                                                        <InlineStack align="space-between" blockAlign="center">
                                                            <Button size="slim" icon={reel.isLive ? HideIcon : ViewIcon} onClick={() => fetcher.submit({ intent: "toggle_live", id: reel.id, isLive: reel.isLive }, { method: "post" })} disabled={selectionMode}>{reel.isLive ? "Hide" : "Publish"}</Button>
                                                            <Button size="slim" icon={LinkIcon} onClick={() => handleLinkProduct(reel.id)} disabled={selectionMode} />
                                                            <Button size="slim" icon={EditIcon} onClick={() => { setEditingReel({ id: reel.id, title: reel.productTitle || "", views: reel.views, boostViews: reel.boostViews, likes: reel.likes }); setActiveModal(true); }} disabled={selectionMode} />
                                                        </InlineStack>
                                                    </BlockStack>
                                                </Box>
                                            </Card>
                                        </div>
                                    </Grid.Cell>
                                ))}
                            </Grid>
                        ) : <Card><EmptyState heading="No videos found" image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"><p>Try changing filters or upload new content.</p></EmptyState></Card>}

                        <Box paddingBlockStart="600"><InlineStack align="center"><Pagination hasPrevious={currentPage > 1} onPrevious={() => setSearchParams({ tab: currentTab, page: currentPage - 1, sort: sortValue, q: searchValue })} hasNext={currentPage < totalPages} onNext={() => setSearchParams({ tab: currentTab, page: currentPage + 1, sort: sortValue, q: searchValue })} /></InlineStack></Box>
                    </Box>
                </Tabs>

                <Modal open={activeModal} onClose={() => setActiveModal(false)} title="Edit Stats" primaryAction={{ content: "Save Changes", onAction: () => { fetcher.submit({ intent: "edit", ...editingReel }, { method: "post" }); setActiveModal(false); } }}>
                    <Modal.Section>
                        <BlockStack gap="400">
                            <TextField label="Internal Title" value={editingReel.title} onChange={(v) => setEditingReel({ ...editingReel, title: v })} autoComplete="off" />
                            <Divider />
                            <Text variant="headingSm">Engagement Control</Text>
                            <InlineStack gap="400">
                                <div style={{ flex: 1 }}><TextField label="Real Views (Read Only)" type="number" value={editingReel.views} disabled autoComplete="off" helpText="Views from real customers." /></div>
                                <div style={{ flex: 1 }}><TextField label="Boost Views (Fake)" type="number" value={editingReel.boostViews} onChange={(v) => setEditingReel({ ...editingReel, boostViews: v })} autoComplete="off" helpText="Added to real views for display." /></div>
                            </InlineStack>
                            <TextField label="Likes" type="number" value={editingReel.likes} onChange={(v) => setEditingReel({ ...editingReel, likes: v })} autoComplete="off" />
                        </BlockStack>
                    </Modal.Section>
                </Modal>

                <Modal open={!!previewVideo} onClose={() => setPreviewVideo(null)} title="Video Preview" size="large">
                    <Modal.Section>
                        <div style={{ display: 'flex', justifyContent: 'center', background: '#000' }}>
                            <video src={previewVideo} controls autoPlay style={{ maxHeight: '600px', maxWidth: '100%' }} />
                        </div>
                    </Modal.Section>
                </Modal>
            </Page>
        </AppProvider>
    );
}