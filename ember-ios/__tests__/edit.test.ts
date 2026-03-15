import { parseTimeString } from "../app/(misc)/edit";
import testCases from "./data/parseTimeString.json";

jest.mock("expo-router", () => ({ useRouter: jest.fn(), useLocalSearchParams: jest.fn(() => ({})) }));
jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");
jest.mock("react-native-safe-area-context", () => ({ SafeAreaView: "SafeAreaView" }));
jest.mock("@/lib/supabase", () => ({ supabase: { from: jest.fn() } }));
jest.mock("@/lib/notifications", () => ({ scheduleTaskNotification: jest.fn() }));
jest.mock("@/constants/styles", () => ({ globalStyles: {}, Palette: { textMuted: "#999" } }));

describe("parseTimeString", () => {
    test.each(testCases)("$input ($description)", ({ input, expected }) => {
        const result = parseTimeString(input);
        expect(result.getHours()).toBe(expected.hours);
        expect(result.getMinutes()).toBe(expected.minutes);
        expect(result.getSeconds()).toBe(0);
    });
});
