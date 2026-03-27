import { filterByCategory, sortTasks } from "../../app/(tabs)/index";
import testData from "../data/filterAndSort.json";

jest.mock("react-native-gesture-handler", () => ({}));
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-router", () => ({ useRouter: jest.fn(), useFocusEffect: jest.fn(), useLocalSearchParams: jest.fn(() => ({})) }));
jest.mock("@/lib/supabase", () => ({ supabase: { from: jest.fn() } }));
jest.mock("@/lib/notifications", () => ({ cancelTaskNotification: jest.fn(), scheduleTaskNotification: jest.fn() }));
jest.mock("@/hooks/use-auth-context", () => ({ useAuthContext: jest.fn(() => ({ session: null })) }));

describe("Integration: filterByCategory → sortTasks", () => {
    test.each(testData.cases)("$category + $sortBy: $description", ({ category, sortBy, expectedIds }) => {
        const filtered = filterByCategory(testData.tasks as any, category as any);
        const result = sortTasks(filtered, sortBy as any);

        expect(result.map(t => t.task_id)).toEqual(expectedIds);
    });
});
