import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Offline mode - API features disabled in main branch
const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

interface ReceiptUploadProps {
  onExtractComplete: (items: Array<{ name: string; price: number }>, extractedData?: any) => void;
  onSkip?: () => void;
}

export function ReceiptUpload({ onExtractComplete, onSkip }: ReceiptUploadProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Mohon izinkan akses ke galeri foto');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Gagal memilih gambar');
    }
  };

  const takePhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Mohon izinkan akses ke kamera');
        return;
      }

      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Gagal mengambil foto');
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
  };

  const handleExtract = async () => {
    if (!uploadedImage) {
      Alert.alert('Error', 'Mohon upload foto struk terlebih dahulu');
      return;
    }

    setIsExtracting(true);

    try {
      // Create form data
      const formData = new FormData();
      
      // Get file extension
      const uriParts = uploadedImage.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append('image', {
        uri: uploadedImage,
        name: `receipt.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      // Upload and extract
      const response = await fetch(`${API_URL}/api/split-bill/extract`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Gagal mengekstrak data struk');
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        Alert.alert('Tidak Ada Item', 'Tidak ditemukan item di struk. Silakan coba foto lain atau input manual.');
        return;
      }

      Alert.alert('Berhasil!', `Berhasil mengekstrak ${data.items.length} items!`);
      onExtractComplete(data.items, data);
    } catch (error) {
      console.error('Extract error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Gagal mengekstrak data struk');
    } finally {
      setIsExtracting(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Upload Foto Struk',
      'Pilih sumber foto',
      [
        {
          text: 'Ambil Foto',
          onPress: takePhoto,
        },
        {
          text: 'Pilih dari Galeri',
          onPress: pickImage,
        },
        {
          text: 'Batal',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Struk</Text>
        <Text style={styles.subtitle}>
          Upload foto struk untuk ekstraksi otomatis dengan AI
        </Text>
      </View>

      {!uploadedImage ? (
        <>
          <TouchableOpacity
            style={styles.uploadArea}
            onPress={showImageOptions}
            activeOpacity={0.7}
          >
            <View style={styles.uploadIcon}>
              <Ionicons name="cloud-upload-outline" size={48} color="#3b82f6" />
            </View>
            <Text style={styles.uploadTitle}>Tap untuk Upload Foto Struk</Text>
            <Text style={styles.uploadHint}>
              Atau ambil foto langsung dengan kamera
            </Text>
            <View style={styles.uploadButton}>
              <Ionicons name="camera-outline" size={20} color="#fff" />
              <Text style={styles.uploadButtonText}>Upload Foto</Text>
            </View>
            <Text style={styles.uploadFormat}>
              Format: JPG, PNG, HEIC (max 10MB)
            </Text>
          </TouchableOpacity>

          {onSkip && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={onSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Lewati & Input Manual</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <View style={styles.previewInfo}>
              <Ionicons name="image" size={20} color="#3b82f6" />
              <Text style={styles.previewText}>Foto Struk</Text>
            </View>
            <TouchableOpacity
              onPress={handleRemoveImage}
              disabled={isExtracting}
              style={styles.removeButton}
            >
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>

          <View style={styles.imagePreview}>
            <Image
              source={{ uri: uploadedImage }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>

          <TouchableOpacity
            style={[styles.extractButton, isExtracting && styles.extractButtonDisabled]}
            onPress={handleExtract}
            disabled={isExtracting}
            activeOpacity={0.7}
          >
            {isExtracting ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.extractButtonText}>Mengekstrak...</Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#fff" />
                <Text style={styles.extractButtonText}>Ekstrak Dengan AI</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  uploadArea: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  uploadHint: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  uploadFormat: {
    fontSize: 12,
    color: '#9ca3af',
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  previewContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  removeButton: {
    padding: 4,
  },
  imagePreview: {
    width: '100%',
    height: 300,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  extractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  extractButtonDisabled: {
    opacity: 0.6,
  },
  extractButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
