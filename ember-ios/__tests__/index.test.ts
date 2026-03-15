import { sortTasks, filterByCategory, PRIORITY_COLORS, PRIORITY_ORDER } from "../app/(tabs)/index";
import sortData from "./data/sortTasks.json";
import filterData from "./data/filterByCategory.json";

jest.mock("react-native-gesture-handler", () => ({}));
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-router", () => ({ useRouter: jest.fn(), useFocusEffect: jest.fn(), useLocalSearchParams: jest.fn(() => ({})) }));
jest.mock("@/lib/supabase", () => ({ supabase: { from: jest.fn() } }));
jest.mock("@/lib/notifications", () => ({ cancelTaskNotification: jest.fn(), scheduleTaskNotification: jest.fn() }));
jest.mock("@/hooks/use-auth-context", () => ({ useAuthContext: jest.fn(() => ({ session: null })) }));

describe("PRIORITY_COLORS", () => {
    it("maps LOW to success color", () => expect(PRIORITY_COLORS["LOW"]).toBeDefined());
    it("maps MEDIUM to warning color", () => expect(PRIORITY_COLORS["MEDIUM"]).toBeDefined());
    it("maps HIGH to danger color", () => expect(PRIORITY_COLORS["HIGH"]).toBeDefined());
    it("returns undefined for unknown priority", () => expect(PRIORITY_COLORS["UNKNOWN"]).toBeUndefined());
});

describe("PRIORITY_ORDER", () => {
    it("HIGH ranks before MEDIUM", () => expect(PRIORITY_ORDER["HIGH"]).toBeLessThan(PRIORITY_ORDER["MEDIUM"]));
    it("MEDIUM ranks before LOW", () => expect(PRIORITY_ORDER["MEDIUM"]).toBeLessThan(PRIORITY_ORDER["LOW"]));
});

describe("sortTasks", () => {
    test.each(sortData.cases)("$sortBy: $description", ({ sortBy, expectedOrder }) => {
        const result = sortTasks(sortData.tasks as any, sortBy as any);
        expect(result.map(t => t.task_id)).toEqual(expectedOrder);
    });
});

describe("filterByCategory", () => {
    test.each(filterData.cases)("$category: $description", ({ category, expectedIds }) => {
        const result = filterByCategory(filterData.tasks as any, category as any);
        expect(result.map(t => t.task_id)).toEqual(expectedIds);
    });
});
