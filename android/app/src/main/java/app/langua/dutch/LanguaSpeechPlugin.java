package app.langua.dutch;

import android.Manifest;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;
import java.util.List;

/**
 * Speech check for the "Say it" exercises, built for learners rather than for dictation:
 *  - keeps listening through short pauses: when Android ends a segment, it listens again for a moment,
 *    and joins the pieces, so a slow speaker is not cut off mid-sentence;
 *  - ends when the learner taps Stop, after about 1.5 s of silence once they have spoken, or after maxMs;
 *  - retries quietly when the phone's recogniser fails right at the start (a common first-use glitch);
 *  - reports "no-match" (heard speech, but no Dutch words) separately from "no-speech" (silence).
 * Uses the phone's own speech service (free). Result: { matches: [best, alternative, ...] }.
 */
@CapacitorPlugin(name = "LanguaSpeech", permissions = { @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "microphone") })
public class LanguaSpeechPlugin extends Plugin {

    private final Handler main = new Handler(Looper.getMainLooper());
    private SpeechRecognizer recognizer;
    private PluginCall call;
    private String language = "nl-NL";
    private int maxResults = 5, maxMs = 15000, silenceMs = 1500;
    private long startedAt, segmentStartedAt;
    private boolean stopping, heardSpeech, segmentHasSpeech;
    private int retries;
    private final List<ArrayList<String>> segments = new ArrayList<>();
    private Runnable continuationTimeout, hardTimeout;

    @PluginMethod
    public void available(PluginCall c) {
        JSObject r = new JSObject();
        r.put("available", SpeechRecognizer.isRecognitionAvailable(getContext()));
        c.resolve(r);
    }

    @PluginMethod
    public void start(PluginCall c) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", c, "afterPermission");
            return;
        }
        begin(c);
    }

    @PermissionCallback
    private void afterPermission(PluginCall c) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) begin(c);
        else c.reject("not-allowed", "not-allowed");
    }

    @PluginMethod
    public void stop(PluginCall c) {
        main.post(() -> {
            if (call == null) return;
            stopping = true;
            cancelTimer(continuationTimeout);
            if (segmentHasSpeech && recognizer != null) {
                try {
                    recognizer.stopListening(); // results for what was said arrive in onResults
                } catch (Exception e) {
                    finish();
                }
                main.postDelayed(this::finish, 2500); // safety net
            } else {
                finish();
            }
        });
        c.resolve();
    }

    private void begin(PluginCall c) {
        main.post(() -> {
            if (call != null) reject("aborted"); // a new attempt replaces an old one
            if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                c.reject("service-not-allowed", "service-not-allowed");
                return;
            }
            call = c;
            language = c.getString("language", "nl-NL");
            maxResults = c.getInt("maxResults", 5);
            maxMs = c.getInt("maxMs", 15000);
            silenceMs = c.getInt("silenceMs", 1500);
            segments.clear();
            stopping = false;
            heardSpeech = false;
            retries = 0;
            startedAt = SystemClock.elapsedRealtime();
            hardTimeout = () -> {
                if (call != null) {
                    stopping = true;
                    if (segmentHasSpeech && recognizer != null) {
                        try { recognizer.stopListening(); } catch (Exception e) { finish(); }
                        main.postDelayed(this::finish, 2500);
                    } else finish();
                }
            };
            main.postDelayed(hardTimeout, maxMs);
            listenSegment();
        });
    }

    private void listenSegment() {
        if (call == null) return;
        if (recognizer == null) {
            recognizer = SpeechRecognizer.createSpeechRecognizer(getActivity());
            recognizer.setRecognitionListener(new Listener());
        }
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, language);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, maxResults);
        i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getContext().getPackageName());
        // Ask the recogniser to wait longer before deciding the learner has finished (not every phone obeys).
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 2500L);
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 2000L);
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 2000L);
        segmentHasSpeech = false;
        segmentStartedAt = SystemClock.elapsedRealtime();
        try {
            recognizer.startListening(i);
        } catch (Exception e) {
            resetRecognizer();
            retryOrFail("aborted");
        }
    }

    private void resetRecognizer() {
        if (recognizer != null) {
            try { recognizer.cancel(); } catch (Exception ignored) {}
            try { recognizer.destroy(); } catch (Exception ignored) {}
            recognizer = null;
        }
    }

    /** After a segment ends, listen once more; if the learner does not start speaking soon, we are done. */
    private void continueOrFinish() {
        long elapsed = SystemClock.elapsedRealtime() - startedAt;
        if (stopping || elapsed > maxMs - 1000) {
            finish();
            return;
        }
        listenSegment();
        continuationTimeout = () -> {
            if (call != null && !segmentHasSpeech) {
                try { recognizer.cancel(); } catch (Exception ignored) {}
                finish();
            }
        };
        main.postDelayed(continuationTimeout, silenceMs);
    }

    private void retryOrFail(String code) {
        boolean early = SystemClock.elapsedRealtime() - segmentStartedAt < 1500;
        if (!stopping && early && retries < 2 && segments.isEmpty()) {
            retries++;
            main.postDelayed(this::listenSegment, 350);
        } else if (!segments.isEmpty()) {
            finish();
        } else {
            reject(code);
        }
    }

    private void finish() {
        if (call == null) return;
        if (segments.isEmpty()) {
            reject(heardSpeech ? "no-match" : "no-speech");
            return;
        }
        // Join the pieces: alternative k = each segment's k-th guess (or its best one).
        JSArray out = new JSArray();
        int n = 0;
        for (ArrayList<String> s : segments) n = Math.max(n, s.size());
        for (int k = 0; k < Math.max(1, n); k++) {
            StringBuilder b = new StringBuilder();
            for (ArrayList<String> s : segments) {
                if (s.isEmpty()) continue;
                if (b.length() > 0) b.append(' ');
                b.append(s.get(Math.min(k, s.size() - 1)));
            }
            out.put(b.toString());
        }
        JSObject r = new JSObject();
        r.put("matches", out);
        PluginCall c = call;
        cleanup();
        c.resolve(r);
    }

    private void reject(String code) {
        if (call == null) return;
        PluginCall c = call;
        cleanup();
        c.reject(code, code);
    }

    private void cleanup() {
        call = null;
        cancelTimer(continuationTimeout);
        cancelTimer(hardTimeout);
        main.removeCallbacksAndMessages(null);
        if (recognizer != null) {
            try { recognizer.cancel(); } catch (Exception ignored) {}
        }
    }

    private void cancelTimer(Runnable r) {
        if (r != null) main.removeCallbacks(r);
    }

    @Override
    protected void handleOnDestroy() {
        main.removeCallbacksAndMessages(null);
        resetRecognizer();
    }

    private class Listener implements RecognitionListener {

        @Override
        public void onReadyForSpeech(Bundle params) {}

        @Override
        public void onBeginningOfSpeech() {
            segmentHasSpeech = true;
            heardSpeech = true;
            cancelTimer(continuationTimeout);
        }

        @Override
        public void onRmsChanged(float rmsdB) {}

        @Override
        public void onBufferReceived(byte[] buffer) {}

        @Override
        public void onEndOfSpeech() {}

        @Override
        public void onPartialResults(Bundle partial) {
            ArrayList<String> m = partial.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (m != null && !m.isEmpty() && m.get(0).trim().length() > 0) {
                segmentHasSpeech = true;
                heardSpeech = true;
                cancelTimer(continuationTimeout);
            }
        }

        @Override
        public void onEvent(int eventType, Bundle params) {}

        @Override
        public void onResults(Bundle results) {
            if (call == null) return;
            ArrayList<String> m = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (m != null && !m.isEmpty() && m.get(0).trim().length() > 0) {
                ArrayList<String> clean = new ArrayList<>();
                for (String s : m) if (s != null && s.trim().length() > 0) clean.add(s.trim());
                segments.add(clean);
            }
            continueOrFinish();
        }

        @Override
        public void onError(int error) {
            if (call == null) return;
            switch (error) {
                case SpeechRecognizer.ERROR_NO_MATCH:
                case SpeechRecognizer.ERROR_SPEECH_TIMEOUT:
                    if (!segments.isEmpty()) finish();
                    else if (segmentHasSpeech || heardSpeech) {
                        if (stopping) finish(); else retryOrFail("no-match");
                    } else if (stopping) finish();
                    else retryOrFail("no-speech");
                    break;
                case SpeechRecognizer.ERROR_CLIENT:
                case SpeechRecognizer.ERROR_RECOGNIZER_BUSY:
                    resetRecognizer();
                    if (stopping) finish(); else retryOrFail("aborted");
                    break;
                case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS:
                    reject("not-allowed");
                    break;
                case SpeechRecognizer.ERROR_NETWORK:
                case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
                case SpeechRecognizer.ERROR_SERVER:
                    if (!segments.isEmpty()) finish(); else reject("network");
                    break;
                case SpeechRecognizer.ERROR_AUDIO:
                    reject("audio-capture");
                    break;
                default:
                    resetRecognizer();
                    if (!segments.isEmpty()) finish(); else retryOrFail("aborted");
            }
        }
    }
}
