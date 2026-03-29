# BarberShop Pro - Complete Admin Panel Upgrade

## Current State
- Backend: Services (CRUD partial), Appointments (create/cancel/confirm), Authorization (admin/user roles), stats by month/category
- Appointments do NOT have barberId/barberName fields
- No Barbers entity
- No Business Configuration
- No Gallery
- No Promotions
- No income calculation endpoints
- No add/delete service endpoints
- Frontend AdminPanel: Dashboard (bar chart, KPIs), Reservation management, Service editing
- Client flow: booking modal without barber selection

## Requested Changes (Diff)

### Add
- Barbers: id, name, active, schedule (workDays[], startTime, endTime)
- addBarber, updateBarber, toggleBarberActive, getBarbers backend functions
- addService, deleteService, toggleServiceActive backend functions
- Service.active field
- Appointment.barberId + Appointment.barberName fields
- Updated createAppointment signature with barberId/barberName
- checkSlotAvailableForBarber(date, time, barberId) - per-barber conflict check
- BusinessConfig: workDays[], startTime, endTime, blockedDates[]
- getBusinessConfig, updateBusinessConfig backend functions
- getIncomeStats(period: daily/monthly/annual) → based on confirmed appointments
- Gallery: id, imageUrl, title, createdAt
- addGalleryItem, deleteGalleryItem, getGalleryItems backend functions
- Promotions: id, title, description, active, startDate, endDate
- addPromotion, updatePromotion, deletePromotion, getPromotions backend functions
- Admin panel sections: Barbers, Business Config, Billing/Income, Gallery, Promotions
- Updated Dashboard: filter by barber, show income KPIs
- Updated Reservation management: show barberName, filter by barber
- Updated Booking modal (client): step to select barber, per-barber slot validation

### Modify
- Appointment type: add barberId (Nat), barberName (Text) fields
- createAppointment: accept barberId + barberName, check per-barber conflicts
- getAppointmentStats: accept barberId filter param
- updateService: keep as-is but also support active toggle
- AdminPanel component: expand with new sections (Barbers, Business Config, Billing, Gallery, Promotions)
- BookingModal: add barber selection step, validate per-barber availability

### Remove
- Nothing removed

## Implementation Plan
1. Generate new Motoko backend with all new entities and endpoints
2. Delegate complete frontend rewrite to frontend subagent:
   - New AdminPanel with sidebar navigation: Dashboard, Reservas, Servicios, Barberos, Configuración, Facturación, Galería, Promociones
   - Updated BookingModal with barber selection
   - All sections wired to backend APIs
   - Mobile-responsive design
