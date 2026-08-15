import React, { createElement, useEffect, useState, useRef } from 'react';
import {
    Alert,
    Linking,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
    ActivityIndicator,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import { fetchCatalog, processShelfPhoto } from '../services/api';

type MatchedBook = {
    id?: number;
    title?: string;
    author?: string;
    alternate_titles?: string | null;
    format?: string | null;
    [key: string]: unknown;
};

type MatchResult = {
    extracted_text?: string;
    matched_book?: MatchedBook;
    confidence_score?: number;
    [key: string]: unknown;
};

type ProcessPhotoResponse = {
    results?: MatchResult[];
    message?: string;
    vlm_errors?: string[];
    [key: string]: unknown;
};

function WelcomeScreen({
    busy,
    statusText,
    onTakePhoto,
    onPickImage,
}: {
    busy?: boolean;
    statusText?: string | null;
    onTakePhoto: () => void;
    onPickImage: (image: string | Blob) => void;
}) {
    const [catalogOpen, setCatalogOpen] = useState(false);

    return (
        <View style={styles.permissionContainer}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="View books we can detect"
                hitSlop={12}
                onPress={() => setCatalogOpen(true)}
                style={({ pressed }) => [styles.infoButton, pressed && styles.permissionButtonPressed]}>
                <Text style={styles.infoButtonText}>i</Text>
            </Pressable>
            <Text style={styles.welcomeTitle}>Scan your bookshelf</Text>
            <Text style={styles.welcomeSubtitle}>
                Take a photo of your shelf, or pick one from your gallery. We’ll find the books and match them to the catalog.
            </Text>
            <Pressable
                accessibilityRole="button"
                disabled={busy}
                hitSlop={16}
                onPress={onTakePhoto}
                style={({ pressed }) => [
                    styles.permissionButton,
                    styles.takePhotoButton,
                    pressed && styles.permissionButtonPressed,
                ]}>
                <Text style={styles.permissionButtonText}>
                    {busy ? 'Opening camera...' : 'Take a photo'}
                </Text>
            </Pressable>
            <GalleryButton
                label="Choose from gallery"
                variant="secondary"
                onPicked={onPickImage}
            />
            {statusText ? <Text style={styles.statusText}>{statusText}</Text> : null}
            <Text style={styles.creditText}>Alejandro Noris Gil</Text>
            <CatalogModal visible={catalogOpen} onClose={() => setCatalogOpen(false)} />
        </View>
    );
}

function CatalogModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const [books, setBooks] = useState<MatchedBook[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!visible || loaded) {
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        fetchCatalog()
            .then((data: { books?: MatchedBook[] }) => {
                if (!cancelled) {
                    setBooks(data.books ?? []);
                    setLoaded(true);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Could not load the catalog.');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [visible, loaded]);

    const filtered = books.filter((book) => {
        const haystack = `${book.title ?? ''} ${book.author ?? ''} ${book.alternate_titles ?? ''}`.toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
    });

    return (
        <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                    <View style={styles.modalHeader}>
                        <View style={styles.modalHeaderText}>
                            <Text style={styles.modalTitle}>Books we can detect</Text>
                            <Text style={styles.modalSubtitle}>
                                {loaded
                                    ? `${books.length} titles in the catalog. Scan a shelf and we’ll match these books.`
                                    : 'Scan a shelf photo and we’ll match these catalog titles.'}
                            </Text>
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Close catalog"
                            hitSlop={8}
                            onPress={onClose}
                            style={styles.modalClose}>
                            <Text style={styles.modalCloseText}>×</Text>
                        </Pressable>
                    </View>

                    <TextInput
                        autoCorrect={false}
                        placeholder="Search title or author"
                        placeholderTextColor="#8A8D93"
                        style={styles.modalSearch}
                        value={query}
                        onChangeText={setQuery}
                    />

                    {loading ? (
                        <View style={styles.modalStatus}>
                            <ActivityIndicator color="#208AEF" />
                        </View>
                    ) : error ? (
                        <Text style={styles.modalError}>{error}</Text>
                    ) : (
                        <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
                            {filtered.length === 0 ? (
                                <Text style={styles.modalEmpty}>No titles match that search.</Text>
                            ) : (
                                filtered.map((book) => (
                                    <View key={`${book.id}-${book.format}`} style={styles.catalogRow}>
                                        <Text style={styles.catalogTitle}>{book.title || 'Untitled'}</Text>
                                        <Text style={styles.catalogMeta}>
                                            {[book.author, book.format].filter(Boolean).join(' · ')}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
}

function GalleryButton({
    label,
    onPicked,
    variant = 'primary',
}: {
    label: string;
    onPicked: (image: string | Blob) => void;
    variant?: 'primary' | 'secondary' | 'camera';
}) {
    const pickNative = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]?.uri) {
            onPicked(result.assets[0].uri);
        }
    };

    const buttonStyle =
        variant === 'camera'
            ? styles.galleryButton
            : variant === 'secondary'
              ? [styles.permissionButton, styles.secondaryPermissionButton]
              : styles.permissionButton;
    const labelStyle =
        variant === 'camera'
            ? styles.galleryButtonText
            : variant === 'secondary'
              ? styles.secondaryPermissionButtonText
              : styles.permissionButtonText;

    if (Platform.OS === 'web') {
        return (
            <View style={[buttonStyle, styles.galleryHitArea]}>
                <Text style={labelStyle}>{label}</Text>
                {createElement('input', {
                    type: 'file',
                    accept: 'image/*',
                    onChange: (event: { target: HTMLInputElement }) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        if (file) {
                            onPicked(file);
                        }
                    },
                    style: {
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100%',
                        margin: 0,
                        opacity: 0,
                        cursor: 'pointer',
                        fontSize: 0,
                        appearance: 'none',
                    },
                })}
            </View>
        );
    }

    return (
        <Pressable
            accessibilityRole="button"
            onPress={pickNative}
            style={({ pressed }) => [buttonStyle, pressed && styles.permissionButtonPressed]}>
            <Text style={labelStyle}>{label}</Text>
        </Pressable>
    );
}

function isWebCameraSupported() {
    if (Platform.OS !== 'web') {
        return true;
    }
    return typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function';
}

function ResultCard({ item, index }: { item: MatchResult; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const book = item.matched_book ?? {};

    return (
        <View style={styles.bookCard}>
            <Pressable onPress={() => setExpanded((open) => !open)} style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                    <Text style={styles.bookTitle}>{book.title || `Match ${index + 1}`}</Text>
                    <Text style={styles.bookAuthor}>{book.author || 'Unknown author'}</Text>
                    <Text style={styles.bookScore}>Confidence: {item.confidence_score ?? 0}%</Text>
                </View>
                <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
            </Pressable>

            {expanded ? (
                <View style={styles.dropdown}>
                    <DetailRow label="Extracted text" value={item.extracted_text} />
                    <DetailRow label="Book ID" value={book.id} />
                    <DetailRow label="Title" value={book.title} />
                    <DetailRow label="Author" value={book.author} />
                    <DetailRow label="Alternate titles" value={book.alternate_titles} />
                    <DetailRow label="Format" value={book.format} />
                    <DetailRow label="Confidence score" value={item.confidence_score} />
                </View>
            ) : null}
        </View>
    );
}

function DetailRow({ label, value }: { label: string; value: unknown }) {
    const display =
        value === null || value === undefined || value === ''
            ? '—'
            : typeof value === 'string' || typeof value === 'number'
              ? String(value)
              : JSON.stringify(value);

    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text selectable style={styles.detailValue}>
                {display}
            </Text>
        </View>
    );
}

export default function IndexScreen() {
    const [facing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [statusText, setStatusText] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const cameraRef = useRef<CameraView>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [apiResponse, setApiResponse] = useState<ProcessPhotoResponse | null>(null);
    const [cameraArmed, setCameraArmed] = useState(false);
    const [showMenu, setShowMenu] = useState(true);

    useEffect(() => {
        if (!permission?.granted) {
            setCameraArmed(false);
            return;
        }

        const timer = setTimeout(() => setCameraArmed(true), 800);
        return () => clearTimeout(timer);
    }, [permission?.granted]);

    async function handleGrantPermission() {
        setBusy(true);
        setStatusText(
            Platform.OS === 'web'
                ? 'Safari will ask for camera access at the top of the screen.'
                : 'Your phone will ask for camera access next.'
        );

        try {
            if (!isWebCameraSupported()) {
                setStatusText('Safari blocks the camera on HTTP.');
                return;
            }

            const result = await requestPermission();
            if (result.granted) {
                setShowMenu(false);
                setStatusText(null);
                return;
            }

            if (!result.canAskAgain && Platform.OS !== 'web') {
                Alert.alert(
                    'Camera permission',
                    'Enable the camera in system settings to continue.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open settings', onPress: () => Linking.openSettings() },
                    ]
                );
                setStatusText('Camera is blocked in system settings.');
                return;
            }

            setStatusText(
                Platform.OS === 'web'
                    ? 'Permission was denied. Allow Camera in Safari site settings, then try again.'
                    : 'Camera permission was not granted.'
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Could not access the camera.';
            setStatusText(message);
        } finally {
            setBusy(false);
        }
    }

    const analyzeImage = async (image: string | Blob) => {
        setIsAnalyzing(true);
        try {
            const response = await processShelfPhoto(image);
            if (response?.vlm_errors?.length) {
                console.warn('Vision errors:', response.vlm_errors);
            }
            setApiResponse(response);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not process the image. Check the console for details.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const takePicture = async () => {
        if (!cameraArmed || !cameraRef.current || isAnalyzing) return;

        try {
            const photo = await cameraRef.current.takePictureAsync({ base64: false });
            if (!photo) return;
            await analyzeImage(photo.uri);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not take the photo. Try again.');
        }
    };

    if (isAnalyzing) {
        return (
            <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color="#208AEF" />
                <Text style={styles.analyzingTitle}>Analyzing shelf...</Text>
                <Text style={styles.analyzingSubtitle}>
                    Detecting spines and matching books. This can take a few seconds.
                </Text>
            </View>
        );
    }

    if (apiResponse) {
        const results = apiResponse.results ?? [];

        return (
            <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Detected books</Text>
                <ScrollView style={styles.scrollView}>
                    {apiResponse.message ? (
                        <Text style={styles.noResultsText}>{apiResponse.message}</Text>
                    ) : null}

                    {results.length === 0 ? (
                        <Text style={styles.noResultsText}>No matches found.</Text>
                    ) : (
                        results.map((item, index) => (
                            <ResultCard key={item.matched_book?.id ?? index} item={item} index={index} />
                        ))
                    )}
                </ScrollView>
                <View style={styles.resultsActions}>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => {
                            setShowMenu(false);
                            setApiResponse(null);
                        }}>
                        <Text style={styles.retryButtonText}>Scan again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => {
                            setApiResponse(null);
                            setShowMenu(true);
                        }}>
                        <Text style={styles.menuButtonText}>Back to menu</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (showMenu || !permission?.granted) {
        return (
            <WelcomeScreen
                busy={busy}
                statusText={statusText}
                onTakePhoto={
                    permission?.granted
                        ? () => setShowMenu(false)
                        : handleGrantPermission
                }
                onPickImage={analyzeImage}
            />
        );
    }

    return (
        <View style={styles.container}>
            <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
            <View style={styles.overlay} pointerEvents="box-none">
                <View style={styles.bottomControls}>
                    <Text style={styles.cameraHint}>Line up the bookshelf, then tap the shutter</Text>
                    {cameraArmed ? (
                        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                            <View style={styles.captureButtonInner} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.captureButtonPlaceholder} />
                    )}
                    <GalleryButton
                        label="Choose from gallery"
                        variant="camera"
                        onPicked={analyzeImage}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    camera: { flex: 1 },
    overlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 40,
    },
    bottomControls: {
        width: '100%',
        alignItems: 'center',
        gap: 16,
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonInner: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#ffffff',
    },
    galleryButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    galleryHitArea: {
        position: 'relative',
        overflow: 'hidden',
        alignSelf: 'center',
    },
    takePhotoButton: {
        position: 'relative',
        zIndex: 2,
    },
    captureButtonPlaceholder: {
        width: 70,
        height: 70,
    },
    galleryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingBox: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: '50%',
    },
    loadingText: { color: 'white', marginTop: 10, fontSize: 16 },
    analyzingContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    analyzingTitle: {
        marginTop: 20,
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    analyzingSubtitle: {
        marginTop: 8,
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        maxWidth: 320,
        lineHeight: 22,
    },
    resultsContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    resultsTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
    },
    scrollView: { flex: 1 },
    noResultsText: { textAlign: 'center', fontSize: 16, color: '#666', marginTop: 20, marginBottom: 12 },
    bookCard: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
    },
    cardHeaderText: {
        flex: 1,
    },
    chevron: {
        fontSize: 12,
        color: '#60646C',
        marginTop: 6,
    },
    bookTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    bookAuthor: { fontSize: 14, color: '#666', marginTop: 4 },
    bookScore: { fontSize: 12, color: '#208AEF', marginTop: 8, fontWeight: '600' },
    dropdown: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#ECEDEF',
        gap: 8,
    },
    detailRow: {
        gap: 2,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#60646C',
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 14,
        color: '#111',
    },
    resultsActions: {
        gap: 12,
        marginVertical: 20,
    },
    retryButton: {
        backgroundColor: '#208AEF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    retryButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    menuButton: {
        backgroundColor: '#F0F0F3',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    menuButtonText: { color: '#111111', fontSize: 16, fontWeight: 'bold' },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
        backgroundColor: '#ffffff',
    },
    infoButton: {
        position: 'absolute',
        top: 24,
        right: 24,
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#208AEF',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        zIndex: 3,
    },
    infoButtonText: {
        color: '#208AEF',
        fontSize: 18,
        fontWeight: '700',
        fontStyle: 'italic',
        lineHeight: 20,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    modalCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        maxHeight: '90%',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        width: '100%',
        maxWidth: 480,
        alignSelf: 'center',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
    },
    modalHeaderText: {
        flex: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111111',
    },
    modalSubtitle: {
        marginTop: 6,
        fontSize: 14,
        lineHeight: 20,
        color: '#60646C',
    },
    modalClose: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0F0F3',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCloseText: {
        fontSize: 22,
        color: '#111111',
        lineHeight: 24,
    },
    modalSearch: {
        borderWidth: 1,
        borderColor: '#E4E5E8',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: '#111111',
        marginBottom: 12,
    },
    modalList: {
        maxHeight: 420,
    },
    modalStatus: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    modalError: {
        paddingVertical: 24,
        textAlign: 'center',
        color: '#C2410C',
        fontSize: 14,
    },
    modalEmpty: {
        paddingVertical: 24,
        textAlign: 'center',
        color: '#60646C',
        fontSize: 14,
    },
    catalogRow: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ECEDEF',
    },
    catalogTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111111',
    },
    catalogMeta: {
        marginTop: 4,
        fontSize: 13,
        color: '#60646C',
    },
    welcomeTitle: {
        textAlign: 'center',
        fontSize: 28,
        fontWeight: '700',
        color: '#111111',
        marginBottom: 12,
    },
    welcomeSubtitle: {
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
        color: '#60646C',
        maxWidth: 360,
        marginBottom: 28,
    },
    cameraHint: {
        color: '#ffffff',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    permissionButton: {
        backgroundColor: '#208AEF',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        minWidth: 220,
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    permissionButtonPressed: { opacity: 0.7 },
    permissionButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
    secondaryPermissionButton: {
        backgroundColor: '#F0F0F3',
        marginTop: 12,
        zIndex: 1,
    },
    secondaryPermissionButtonText: { color: '#111111', fontWeight: '600', fontSize: 16 },
    statusText: { marginTop: 16, textAlign: 'center', color: '#60646C', maxWidth: 360, lineHeight: 22 },
    creditText: {
        position: 'absolute',
        bottom: 24,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '600',
        color: '#8A8D93',
    },
});
