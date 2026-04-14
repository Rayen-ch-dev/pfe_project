import { View, Text } from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function QR() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ marginBottom: 20 }}>Your QR Code</Text>
      <QRCode value="2b598852-b64c-4211-9471-f47505a967b8" size={200} />
    </View>
  );
}