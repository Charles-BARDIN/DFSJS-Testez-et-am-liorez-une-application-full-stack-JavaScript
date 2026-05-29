import { describe, it, expect, vi, beforeEach } from "vitest";
import { TeacherService } from "./teacher.service";
import { AppError } from "../errors/AppError";

const mockRepo = { findAll: vi.fn(), findById: vi.fn() };
let service: TeacherService;

beforeEach(() => {
  vi.clearAllMocks();
  service = new TeacherService(mockRepo as never);
});

const teacher = (id: number) => ({
  id,
  firstName: `F${id}`,
  lastName: `L${id}`,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("TeacherService", () => {
  it("getAll renvoie la liste mappée", async () => {
    mockRepo.findAll.mockResolvedValue([teacher(1), teacher(2)]);
    const result = await service.getAll();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 1, firstName: "F1", lastName: "L1" });
  });

  it("getById renvoie le teacher trouvé", async () => {
    mockRepo.findById.mockResolvedValue(teacher(5));
    const result = await service.getById(5);
    expect(result.id).toBe(5);
  });

  it("getById throw 404 si non trouvé", async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.getById(99)).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(service.getById(99)).rejects.toBeInstanceOf(AppError);
  });
});
