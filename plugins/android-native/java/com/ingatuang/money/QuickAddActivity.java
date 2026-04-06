package com.ingatuang.money;

import android.Manifest;
import android.content.pm.PackageManager;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.view.animation.ScaleAnimation;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.ingatuang.money.repository.TransactionRepository;
import java.util.ArrayList;
import java.util.Locale;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;

public class QuickAddActivity extends Activity {
    private static final String TAG = "QuickAddActivity";
    private static final int SPEECH_REQUEST_CODE = 100;
    private EditText inputText;
    private View voiceButtonOrb;
    private View orbGlow;
    private TextView aiStatusText;
    private Button submitButton;
    private Button cancelButton;
    private View actionsContainer;
    
    private View waveBar1, waveBar2, waveBar3, waveBar4, waveBar5;
    private SpeechRecognizer speechRecognizer;
    private boolean isListening = false;
    private boolean isAnimatingWave = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(android.view.Window.FEATURE_NO_TITLE);
        if (getWindow() != null) {
            getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        }
        setContentView(R.layout.activity_quick_add);

        Log.d(TAG, "QuickAddActivity created with premium UI");

        // Initialize views
        inputText = findViewById(R.id.input_text);
        voiceButtonOrb = findViewById(R.id.voice_button_orb);
        orbGlow = findViewById(R.id.orb_glow);
        aiStatusText = findViewById(R.id.ai_status_text);
        submitButton = findViewById(R.id.submit_button);
        cancelButton = findViewById(R.id.cancel_button);
        actionsContainer = findViewById(R.id.actions_container);
        
        waveBar1 = findViewById(R.id.wave_bar_1);
        waveBar2 = findViewById(R.id.wave_bar_2);
        waveBar3 = findViewById(R.id.wave_bar_3);
        waveBar4 = findViewById(R.id.wave_bar_4);
        waveBar5 = findViewById(R.id.wave_bar_5);

        // Initialize Services
        if (SpeechRecognizer.isRecognitionAvailable(this)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
            setupSpeechRecognizer();
        } else {
            Log.e(TAG, "Speech Recognition is not available on this device");
            Toast.makeText(this, "Fitur suara tidak didukung di perangkat ini", Toast.LENGTH_LONG).show();
            aiStatusText.setText("SUARA TIDAK TERSEDIA");
        }

        // Orb click listener
        voiceButtonOrb.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (!isListening) {
                    startInternalVoiceInput();
                } else {
                    stopInternalVoiceInput();
                }
            }
        });

        // Submit button click listener
        submitButton.setOnClickListener(v -> submitTransaction());

        // Cancel button click listener
        cancelButton.setOnClickListener(v -> finish());

        // Check auto-start voice
        boolean autoVoice = getIntent().getBooleanExtra("auto_voice", false);
        if (autoVoice) {
            inputText.postDelayed(() -> {
                Log.d(TAG, "Auto-starting voice on launch");
                startInternalVoiceInput();
            }, 800);
        }
        
        startEntranceAnimation();
    }

    @Override
    protected void onStart() {
        super.onStart();
        if (getWindow() != null) {
            // Set wide horizontal pill design (90% width)
            getWindow().setLayout((int)(getResources().getDisplayMetrics().widthPixels * 0.9), android.view.ViewGroup.LayoutParams.WRAP_CONTENT);
        }
    }

    private void startEntranceAnimation() {
        View mainView = findViewById(android.R.id.content);
        mainView.setTranslationY(100f);
        mainView.setAlpha(0f);
        mainView.animate()
            .translationY(0f)
            .alpha(1f)
            .setDuration(500)
            .start();
    }

    private void setupSpeechRecognizer() {
        speechRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override
            public void onReadyForSpeech(Bundle params) {
                isListening = true;
                aiStatusText.setText("MENDENGARKAN...");
                aiStatusText.setTextColor(0xFF3B82F6); // Blue
                startPulsingAnimation();
                isAnimatingWave = true;
            }

            @Override
            public void onBeginningOfSpeech() {}

            @Override
            public void onRmsChanged(float rmsdB) {
                if (!isAnimatingWave) return;
                
                // Scale bars based on volume (RMS level)
                float baseScale = 1.0f + (rmsdB / 10f);
                if (baseScale > 2.2f) baseScale = 2.2f;
                if (baseScale < 1.0f) baseScale = 1.0f;

                waveBar1.setScaleY(baseScale * 0.7f);
                waveBar2.setScaleY(baseScale * 1.3f);
                waveBar3.setScaleY(baseScale * 1.8f);
                waveBar4.setScaleY(baseScale * 1.3f);
                waveBar5.setScaleY(baseScale * 0.7f);
                
                // Also scale orb glow layer
                float orbScale = 1.0f + (rmsdB / 25f);
                orbGlow.setScaleX(orbScale);
                orbGlow.setScaleY(orbScale);
            }

            @Override
            public void onBufferReceived(byte[] buffer) {}

            @Override
            public void onEndOfSpeech() {
                aiStatusText.setText("MENGANALISIS...");
                stopPulsingAnimation();
                isAnimatingWave = false;
                resetWavebars();
            }

            @Override
            public void onError(int error) {
                isListening = false;
                String errorMessage = getErrorText(error);
                Log.e(TAG, "Speech Error: " + errorMessage + " (code: " + error + ")");
                
                if (error == SpeechRecognizer.ERROR_NO_MATCH) {
                    aiStatusText.setText("TIDAK TERDENGAR");
                } else if (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) {
                    aiStatusText.setText("BUTUH IZIN") ;
                    Toast.makeText(QuickAddActivity.this, "Akses mikrofon dibutuhkan untuk fitur ini", Toast.LENGTH_SHORT).show();
                } else {
                    aiStatusText.setText("AI SIAP");
                }
                
                stopPulsingAnimation();
                isAnimatingWave = false;
                resetWavebars();
            }

            @Override
            public void onResults(Bundle results) {
                isListening = false;
                ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (matches != null && !matches.isEmpty()) {
                    String text = matches.get(0);
                    inputText.setText(text);
                    aiStatusText.setText("TERDETEKSI");
                    
                    // Show Input & Buttons with animation
                    showResultsUI();
                }
            }

            @Override
            public void onPartialResults(Bundle partialResults) {}
            @Override
            public void onEvent(int eventType, Bundle params) {}
        });
    }

    private void startInternalVoiceInput() {
        if (speechRecognizer == null || !SpeechRecognizer.isRecognitionAvailable(this)) {
            Toast.makeText(this, "Fitur suara tidak tersedia", Toast.LENGTH_SHORT).show();
            return;
        }

        // Check permissions at runtime
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.RECORD_AUDIO}, SPEECH_REQUEST_CODE);
            return;
        }

        // Hide previous results if any
        inputText.setVisibility(View.GONE);
        actionsContainer.setVisibility(View.GONE);
        
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault());
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        
        try {
            speechRecognizer.startListening(intent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start listening", e);
            Toast.makeText(this, "Gagal memulai perekaman", Toast.LENGTH_SHORT).show();
        }
    }

    private String getErrorText(int errorCode) {
        switch (errorCode) {
            case SpeechRecognizer.ERROR_AUDIO: return "Audio recording error";
            case SpeechRecognizer.ERROR_CLIENT: return "Client side error";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "Insufficient permissions";
            case SpeechRecognizer.ERROR_NETWORK: return "Network error";
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "Network timeout";
            case SpeechRecognizer.ERROR_NO_MATCH: return "No match found";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: return "RecognitionService busy";
            case SpeechRecognizer.ERROR_SERVER: return "Server error";
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "No speech input";
            default: return "Unknown error";
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == SPEECH_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startInternalVoiceInput();
            } else {
                Toast.makeText(this, "Izin mikrofon ditolak", Toast.LENGTH_SHORT).show();
            }
        }
    }

    private void showResultsUI() {
        if (inputText.getVisibility() == View.VISIBLE) return;

        inputText.setAlpha(0f);
        inputText.setVisibility(View.VISIBLE);
        inputText.animate().alpha(1f).setDuration(400).start();

        actionsContainer.setAlpha(0f);
        actionsContainer.setVisibility(View.VISIBLE);
        actionsContainer.animate().alpha(1f).setDuration(400).setStartDelay(100).start();
    }
    
    private void stopInternalVoiceInput() {
        speechRecognizer.stopListening();
        isListening = false;
        stopPulsingAnimation();
        isAnimatingWave = false;
        resetWavebars();
    }

    private void resetWavebars() {
        waveBar1.animate().scaleY(1f).setDuration(200).start();
        waveBar2.animate().scaleY(1f).setDuration(200).start();
        waveBar3.animate().scaleY(1f).setDuration(200).start();
        waveBar4.animate().scaleY(1f).setDuration(200).start();
        waveBar5.animate().scaleY(1f).setDuration(200).start();
    }

    private void startPulsingAnimation() {
        AlphaAnimation alpha = new AlphaAnimation(0.4f, 0.8f);
        alpha.setDuration(600);
        alpha.setRepeatCount(Animation.INFINITE);
        alpha.setRepeatMode(Animation.REVERSE);
        orbGlow.startAnimation(alpha);
    }

    private void stopPulsingAnimation() {
        orbGlow.clearAnimation();
        orbGlow.setScaleX(1f);
        orbGlow.setScaleY(1f);
    }



    private void submitTransaction() {
        String text = inputText.getText().toString().trim();
        if (text.isEmpty()) {
            Toast.makeText(this, "Mohon isi transaksi", Toast.LENGTH_SHORT).show();
            return;
        }

        boolean success = TransactionParser.parseAndSave(this, text);
        if (success) {
            Toast.makeText(this, "Berhasil disimpan!", Toast.LENGTH_SHORT).show();
            finish();
        } else {
            Toast.makeText(this, "Gagal menyimpan", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onDestroy() {
        if (speechRecognizer != null) speechRecognizer.destroy();
        super.onDestroy();
    }
}

