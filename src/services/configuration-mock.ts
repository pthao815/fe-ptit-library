import { initialPolicies, initialPenaltyTypes, initialSearchConfigs } from "../data/configuration";
import type { Policy, PenaltyType, DemoMode } from "../types/configuration";

// Module memory survives client navigation, but not a full refresh. No network/storage.
let snapshot = {
  policies: initialPolicies.map((item) => ({ ...item })),
  penaltyTypes: initialPenaltyTypes.map((item) => ({ ...item })),
  searchConfigs: initialSearchConfigs.map((item) => ({ ...item })),
};
const listeners = new Set<() => void>();
const delay = () => new Promise<void>((resolve) => window.setTimeout(resolve, 450));
function publish() { listeners.forEach((listener) => listener()); }
async function write(fail: boolean) {
  await delay();
  if (fail) throw new Error("Lỗi lưu demo. Dữ liệu chưa thay đổi; hãy bỏ chọn mô phỏng lỗi và thử lại.");
}
export const configurationMock = {
  getSnapshot: () => snapshot,
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  async load(mode: DemoMode) {
    await delay();
    if (mode === "error") throw new Error("Không thể tải dữ liệu demo. Chọn Thử lại để tải bình thường.");
  },
  async updatePolicy(policy: Policy, fail = false) {
    await write(fail);
    if (!snapshot.policies.some((item) => item.id === policy.id)) throw new Error("Không tìm thấy chính sách demo.");
    snapshot = { ...snapshot, policies: snapshot.policies.map((item) => item.id === policy.id ? { ...policy, docType: policy.docType.trim() } : item) };
    publish();
  },
  async savePenalty(penalty: Omit<PenaltyType, "id"> & { id?: number }, fail = false) {
    await write(fail);
    const code = penalty.code.trim();
    if (snapshot.penaltyTypes.some((item) => item.code === code && item.id !== penalty.id)) throw new Error("Mã loại phạt đã tồn tại.");
    const saved = { ...penalty, code, name: penalty.name.trim(), unitName: penalty.unitName.trim(), id: penalty.id ?? Math.max(0, ...snapshot.penaltyTypes.map((item) => item.id)) + 1 };
    snapshot = { ...snapshot, penaltyTypes: penalty.id === undefined ? [...snapshot.penaltyTypes, saved] : snapshot.penaltyTypes.map((item) => item.id === penalty.id ? saved : item) };
    publish();
  },
  async activate(id: number, fail = false) {
    await write(fail);
    if (!snapshot.searchConfigs.some((item) => item.id === id)) throw new Error("Không tìm thấy cấu hình demo.");
    snapshot = { ...snapshot, searchConfigs: snapshot.searchConfigs.map((item) => ({ ...item, isActive: item.id === id })) };
    publish();
  },
};
