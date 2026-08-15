import React, { useState, useRef } from 'react';
import {
    Alert,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';

import { processShelfPhoto } from '../services/api';

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

    async function handleGrantPermission() {
        setBusy(true);
        setStatusText(
            Platform.OS === 'web'
                ? 'Look at the top of Safari and allow the camera.'
                : 'Waiting for the system permission dialog...'
        );

        try {
            if (!isWebCameraSupported()) {
                setStatusText('Safari blocks the camera on HTTP.');
                return;
            }

            if (Platform.OS === 'web') {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach((track) => track.stop());
            }

            const result = await requestPermission();
            if (result.granted) {
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

    const takePicture = async () => {
        if (!cameraRef.current || isAnalyzing) return;

        try {
            const photo = await cameraRef.current.takePictureAsync({ base64: false });
            if (!photo) return;

            setIsAnalyzing(true);
            const response = await processShelfPhoto(photo.uri);
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

    if (!isWebCameraSupported()) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.message}>Camera is blocked in this browser</Text>
            </View>
        );
    }

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    hitSlop={16}
                    onPress={handleGrantPermission}
                    style={({ pressed }) => [
                        styles.permissionButton,
                        pressed && styles.permissionButtonPressed,
                    ]}>
                    <Text style={styles.permissionButtonText}>
                        {busy ? 'Requesting...' : 'Grant Permission'}
                    </Text>
                </Pressable>
                {statusText ? <Text style={styles.statusText}>{statusText}</Text> : null}
            </View>
        );
    }

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
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => setApiResponse(null)}>
                    <Text style={styles.retryButtonText}>Scan again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
            <View style={styles.overlay} pointerEvents="box-none">
                <View style={styles.bottomControls}>
                    <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                        <View style={styles.captureButtonInner} />
                    </TouchableOpacity>
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
    retryButton: {
        backgroundColor: '#208AEF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 20,
    },
    retryButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#ffffff',
    },
    message: { textAlign: 'center', paddingBottom: 16, fontSize: 18, fontWeight: '600', color: '#000000' },
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
    statusText: { marginTop: 16, textAlign: 'center', color: '#60646C', maxWidth: 360, lineHeight: 22 },
});
