package app.langua.dutch;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LanguaSpeechPlugin.class); // the app's own speech check (see LanguaSpeechPlugin)
        super.onCreate(savedInstanceState);
    }
}
