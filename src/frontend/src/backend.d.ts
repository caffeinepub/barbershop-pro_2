import type { Principal } from "@icp-sdk/core/principal";

export interface Service {
  id: bigint;
  name: string;
  description: string;
  durationMinutes: bigint;
  priceAmount: bigint;
  category: string;
  active: boolean;
}

export interface Barber {
  id: bigint;
  name: string;
  active: boolean;
  workDays: bigint[];
  startTime: string;
  endTime: string;
}

export interface Appointment {
  id: bigint;
  serviceId: bigint;
  serviceName: string;
  clientName: string;
  date: string;
  time: string;
  status: string;
  createdAt: bigint;
  owner: Principal;
  barberId: bigint;
  barberName: string;
}

export interface BusinessConfig {
  workDays: bigint[];
  startTime: string;
  endTime: string;
  blockedDates: string[];
}

export interface GalleryItem {
  id: bigint;
  imageUrl: string;
  title: string;
  createdAt: bigint;
}

export interface Promotion {
  id: bigint;
  title: string;
  description: string;
  active: boolean;
  startDate: string;
  endDate: string;
}

export interface DayStat {
  day: bigint;
  count: bigint;
}

export interface IncomeStats {
  daily: bigint;
  monthly: bigint;
  annual: bigint;
}

export enum UserRole {
  admin = "admin",
  user = "user",
  guest = "guest",
}

export interface backendInterface {
  // Auth
  assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
  getCallerUserRole(): Promise<UserRole>;
  isCallerAdmin(): Promise<boolean>;

  // Services
  getServices(): Promise<Array<Service>>;
  getService(id: bigint): Promise<Service | null>;
  getServicesByCategory(category: string): Promise<Array<Service>>;
  addService(name: string, description: string, durationMinutes: bigint, priceAmount: bigint, category: string): Promise<{ __kind__: "ok"; ok: Service } | { __kind__: "err"; err: string }>;
  updateService(id: bigint, name: string, description: string, durationMinutes: bigint, priceAmount: bigint): Promise<{ __kind__: "ok"; ok: Service } | { __kind__: "err"; err: string }>;
  deleteService(id: bigint): Promise<{ __kind__: "ok" } | { __kind__: "err"; err: string }>;
  toggleServiceActive(id: bigint): Promise<{ __kind__: "ok"; ok: Service } | { __kind__: "err"; err: string }>;

  // Barbers
  getBarbers(): Promise<Array<Barber>>;
  addBarber(name: string, workDays: bigint[], startTime: string, endTime: string): Promise<{ __kind__: "ok"; ok: Barber } | { __kind__: "err"; err: string }>;
  updateBarber(id: bigint, name: string, workDays: bigint[], startTime: string, endTime: string): Promise<{ __kind__: "ok"; ok: Barber } | { __kind__: "err"; err: string }>;
  toggleBarberActive(id: bigint): Promise<{ __kind__: "ok"; ok: Barber } | { __kind__: "err"; err: string }>;

  // Appointments
  createAppointment(serviceId: bigint, serviceName: string, clientName: string, date: string, time: string, barberId: bigint, barberName: string): Promise<{ __kind__: "ok"; ok: Appointment } | { __kind__: "err"; err: string }>;
  getMyAppointments(): Promise<Array<Appointment>>;
  getAllAppointments(): Promise<Array<Appointment>>;
  confirmAppointment(id: bigint): Promise<{ __kind__: "ok"; ok: Appointment } | { __kind__: "err"; err: string }>;
  completeAppointment(id: bigint): Promise<{ __kind__: "ok"; ok: Appointment } | { __kind__: "err"; err: string }>;
  cancelAppointment(id: bigint): Promise<{ __kind__: "ok"; ok: Appointment } | { __kind__: "err"; err: string }>;
  checkSlotAvailable(date: string, time: string): Promise<boolean>;
  checkSlotAvailableForBarber(date: string, time: string, barberId: bigint): Promise<boolean>;
  getAppointmentStats(month: bigint, year: bigint, category: string, barberId: bigint): Promise<Array<DayStat>>;
  getIncomeStats(todayDate: string): Promise<IncomeStats>;

  // Business Config
  getBusinessConfig(): Promise<BusinessConfig>;
  updateBusinessConfig(workDays: bigint[], startTime: string, endTime: string, blockedDates: string[]): Promise<{ __kind__: "ok"; ok: BusinessConfig } | { __kind__: "err"; err: string }>;

  // Gallery
  getGalleryItems(): Promise<Array<GalleryItem>>;
  addGalleryItem(imageUrl: string, title: string): Promise<{ __kind__: "ok"; ok: GalleryItem } | { __kind__: "err"; err: string }>;
  deleteGalleryItem(id: bigint): Promise<{ __kind__: "ok" } | { __kind__: "err"; err: string }>;

  // Promotions
  getPromotions(): Promise<Array<Promotion>>;
  addPromotion(title: string, description: string, startDate: string, endDate: string): Promise<{ __kind__: "ok"; ok: Promotion } | { __kind__: "err"; err: string }>;
  updatePromotion(id: bigint, title: string, description: string, active: boolean, startDate: string, endDate: string): Promise<{ __kind__: "ok"; ok: Promotion } | { __kind__: "err"; err: string }>;
  deletePromotion(id: bigint): Promise<{ __kind__: "ok" } | { __kind__: "err"; err: string }>;
}
