import { useState } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { SplitBillItem, SplitBillPerson } from '@/lib/storage';
import { ReceiptUpload } from '@/components/split-bill/receipt-upload';
import { ItemListEditor } from '@/components/split-bill/item-list-editor';
import { ItemEditor } from '@/components/split-bill/item-editor';

type Step = 'upload' | 'edit' | 'assign';

export default function CreateSplitBillScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [extractedItems, setExtractedItems] = useState<Array<{ name: string; price: number }>>([]);
  const [items, setItems] = useState<SplitBillItem[]>([]);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [servicePercentage, setServicePercentage] = useState(0);

  const handleExtractComplete = (
    extractedData: Array<{ name: string; price: number }>,
    metadata?: any
  ) => {
    setExtractedItems(extractedData);
    setTaxPercentage(metadata?.taxPercentage || 0);
    setServicePercentage(metadata?.servicePercentage || 0);
    setStep('edit');
  };

  const handleSkipUpload = () => {
    // Skip to manual input with empty item
    setExtractedItems([{ name: '', price: 0 }]);
    setStep('edit');
  };

  const handleEditContinue = (
    editedItems: SplitBillItem[],
    tax: number,
    service: number
  ) => {
    setItems(editedItems);
    setTaxPercentage(tax);
    setServicePercentage(service);
    setStep('assign');
  };

  const handleAssignContinue = (
    finalItems: SplitBillItem[],
    persons: SplitBillPerson[],
    assignments: Map<string, string[]>
  ) => {
    // Navigate to assign screen with all data
    const assignmentsArray: Array<{ itemId: string; personId: string }> = [];
    assignments.forEach((itemIds, personId) => {
      itemIds.forEach((itemId) => {
        assignmentsArray.push({ itemId, personId });
      });
    });

    router.push({
      pathname: '/split-bill/assign',
      params: {
        title: `Split Bill - ${new Date().toLocaleDateString('id-ID')}`,
        items: JSON.stringify(finalItems),
        persons: JSON.stringify(persons),
        assignments: JSON.stringify(assignmentsArray),
        taxPercentage: taxPercentage.toString(),
        servicePercentage: servicePercentage.toString(),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {step === 'upload' && (
        <View style={styles.stepContainer}>
          <ReceiptUpload 
            onExtractComplete={handleExtractComplete}
            onSkip={handleSkipUpload}
          />
        </View>
      )}

      {step === 'edit' && (
        <ItemListEditor
          initialItems={extractedItems}
          initialTax={taxPercentage}
          initialService={servicePercentage}
          onContinue={handleEditContinue}
          onBack={() => setStep('upload')}
        />
      )}

      {step === 'assign' && (
        <ItemEditor
          initialItems={items}
          onContinue={handleAssignContinue}
          onBack={() => setStep('edit')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  stepContainer: {
    flex: 1,
    padding: 16,
  },
});
