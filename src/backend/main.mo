import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Int "mo:core/Int";

actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ─────────────────────────────────────────────────────────────
  // MIGRATION TYPES  (V1 – match what is stored in stable memory)
  // ─────────────────────────────────────────────────────────────
  type ServiceV1 = {
    id : Nat; name : Text; description : Text;
    durationMinutes : Nat; priceAmount : Nat; category : Text;
  };
  type AppointmentV1 = {
    id : Nat; serviceId : Nat; serviceName : Text; clientName : Text;
    date : Text; time : Text; status : Text; createdAt : Int; owner : Principal;
  };

  // Old stable vars kept ONLY to absorb the stored V1 values without a
  // type-compatibility error.  They are not used in business logic.
  stable let servicesArray : [ServiceV1] = [];
  stable let iterable     : [(Nat, ServiceV1)] = [];
  var services             = Map.empty<Nat, ServiceV1>();   // absorbs old Map
  var appointments         = Map.empty<Nat, AppointmentV1>(); // absorbs old Map

  // Migration flag – set to true after the one-time V1→V2 migration runs.
  stable var _v1Migrated : Bool = false;

  // ─────────────────────────────────────────────────────────────
  // V2 TYPES
  // ─────────────────────────────────────────────────────────────
  public type Service = {
    id : Nat; name : Text; description : Text;
    durationMinutes : Nat; priceAmount : Nat; category : Text; active : Bool;
  };
  public type Appointment = {
    id : Nat; serviceId : Nat; serviceName : Text; clientName : Text;
    date : Text; time : Text; status : Text; createdAt : Int; owner : Principal;
    barberId : Nat; barberName : Text;
  };

  // ─────────────────────────────────────────────────────────────
  // SEED DATA  (used only when there is nothing to migrate)
  // ─────────────────────────────────────────────────────────────
  let _seedServices : [Service] = [
    { id=1;  name="Corte Caballero";    description="Corte clásico para hombre";           durationMinutes=30; priceAmount=1500; category="corte";      active=true },
    { id=2;  name="Tinte Caballero";    description="Tinte para caballero";                durationMinutes=60; priceAmount=3000; category="tinte";      active=true },
    { id=3;  name="Corte Mujer";        description="Corte clásico para dama";             durationMinutes=45; priceAmount=2000; category="corte";      active=true },
    { id=4;  name="Tinte Dama";         description="Tinte para dama";                     durationMinutes=90; priceAmount=4000; category="tinte";      active=true },
    { id=5;  name="Peinado";            description="Peinado para eventos especiales";     durationMinutes=60; priceAmount=2500; category="peinado";    active=true },
    { id=6;  name="Corte Barba";        description="Corte de barba";                      durationMinutes=20; priceAmount=800;  category="barba";      active=true },
    { id=7;  name="Corte Niño";         description="Corte para niño";                      durationMinutes=30; priceAmount=1200; category="corte";      active=true },
    { id=8;  name="Estilizado Barba";   description="Estilizado y diseño de barba";        durationMinutes=30; priceAmount=1500; category="barba";      active=true },
    { id=9;  name="Tratamiento Capilar";description="Tratamiento para caballero";          durationMinutes=45; priceAmount=3500; category="tratamiento";active=true },
    { id=10; name="Tratamiento Dama";   description="Tratamiento capilar para dama";       durationMinutes=60; priceAmount=2000; category="tratamiento";active=true },
    { id=11; name="Corte Especial";     description="Corte para evento";                   durationMinutes=45; priceAmount=1500; category="corte";      active=true },
    { id=12; name="Retoque Tinte";      description="Retoque de tinte";                    durationMinutes=30; priceAmount=1000; category="tinte";      active=true },
  ];

  // ─────────────────────────────────────────────────────────────
  // WORKING MAPS  (V2 – all business logic uses these)
  // ─────────────────────────────────────────────────────────────
  var servicesMap     = Map.empty<Nat, Service>();
  var appointmentsMap = Map.empty<Nat, Appointment>();

  // Counters
  var serviceIdCounter = 13;
  var appointmentId    = 1;

  // ─────────────────────────────────────────────────────────────
  // ONE-TIME MIGRATION  (runs after every upgrade; idempotent)
  // ─────────────────────────────────────────────────────────────
  system func postupgrade() {
    if (not _v1Migrated) {
      // Migrate V1 services
      if (services.size() > 0) {
        for ((id, s) in services.entries()) {
          servicesMap.add(id, {
            id=s.id; name=s.name; description=s.description;
            durationMinutes=s.durationMinutes; priceAmount=s.priceAmount;
            category=s.category; active=true;
          });
        };
        // Keep counter above the largest migrated id
        for ((id, _) in services.entries()) {
          if (id >= serviceIdCounter) { serviceIdCounter := id + 1 };
        };
      } else {
        // Fresh install – seed with default services
        for (s in _seedServices.vals()) {
          servicesMap.add(s.id, s);
        };
      };
      // Migrate V1 appointments
      for ((id, a) in appointments.entries()) {
        appointmentsMap.add(id, {
          id=a.id; serviceId=a.serviceId; serviceName=a.serviceName;
          clientName=a.clientName; date=a.date; time=a.time;
          status=a.status; createdAt=a.createdAt; owner=a.owner;
          barberId=0; barberName="";
        });
        if (a.id >= appointmentId) { appointmentId := a.id + 1 };
      };
      // Release old V1 maps to free memory
      services     := Map.empty<Nat, ServiceV1>();
      appointments := Map.empty<Nat, AppointmentV1>();
      _v1Migrated  := true;
    };
  };

  // ─────────────────────────────────────────────────────────────
  // SERVICES
  // ─────────────────────────────────────────────────────────────
  public query func getServices() : async [Service] {
    servicesMap.values().toArray();
  };
  public query func getService(id : Nat) : async ?Service {
    servicesMap.get(id);
  };
  public query func getServicesByCategory(category : Text) : async [Service] {
    servicesMap.values().filter(func(s) { s.category == category }).toArray();
  };
  public shared func addService(
    name : Text, description : Text, durationMinutes : Nat, priceAmount : Nat, category : Text
  ) : async { #ok : Service; #err : Text } {
    let id = serviceIdCounter; serviceIdCounter += 1;
    let svc : Service = { id; name; description; durationMinutes; priceAmount; category; active=true };
    servicesMap.add(id, svc); #ok(svc);
  };
  public shared func updateService(
    id : Nat, name : Text, description : Text, durationMinutes : Nat, priceAmount : Nat
  ) : async { #ok : Service; #err : Text } {
    switch (servicesMap.get(id)) {
      case null { #err("Servicio no encontrado") };
      case (?e) {
        let u : Service = { id=e.id; name; description; durationMinutes; priceAmount; category=e.category; active=e.active };
        servicesMap.remove(id); servicesMap.add(id, u); #ok(u);
      };
    };
  };
  public shared func deleteService(id : Nat) : async { #ok; #err : Text } {
    switch (servicesMap.get(id)) {
      case null { #err("Servicio no encontrado") };
      case (?_) { servicesMap.remove(id); #ok };
    };
  };
  public shared func toggleServiceActive(id : Nat) : async { #ok : Service; #err : Text } {
    switch (servicesMap.get(id)) {
      case null { #err("Servicio no encontrado") };
      case (?e) {
        let u : Service = { id=e.id; name=e.name; description=e.description; durationMinutes=e.durationMinutes; priceAmount=e.priceAmount; category=e.category; active=not e.active };
        servicesMap.remove(id); servicesMap.add(id, u); #ok(u);
      };
    };
  };

  // ─────────────────────────────────────────────────────────────
  // BARBERS
  // ─────────────────────────────────────────────────────────────
  public type Barber = {
    id : Nat; name : Text; active : Bool;
    workDays : [Nat]; startTime : Text; endTime : Text;
  };
  var barberIdCounter = 4;
  var barbersMap = Map.fromIter<Nat, Barber>([
    (1, { id=1; name="Carlos"; active=true; workDays=[1,2,3,4,5,6]; startTime="09:00"; endTime="19:00" }),
    (2, { id=2; name="Miguel"; active=true; workDays=[1,2,3,4,5];   startTime="10:00"; endTime="18:00" }),
    (3, { id=3; name="Sofía";  active=true; workDays=[2,3,4,5,6];   startTime="09:00"; endTime="17:00" }),
  ].values());

  public query func getBarbers() : async [Barber] { barbersMap.values().toArray() };
  public shared func addBarber(
    name : Text, workDays : [Nat], startTime : Text, endTime : Text
  ) : async { #ok : Barber; #err : Text } {
    let id = barberIdCounter; barberIdCounter += 1;
    let b : Barber = { id; name; active=true; workDays; startTime; endTime };
    barbersMap.add(id, b); #ok(b);
  };
  public shared func updateBarber(
    id : Nat, name : Text, workDays : [Nat], startTime : Text, endTime : Text
  ) : async { #ok : Barber; #err : Text } {
    switch (barbersMap.get(id)) {
      case null { #err("Barbero no encontrado") };
      case (?e) {
        let u : Barber = { id=e.id; name; active=e.active; workDays; startTime; endTime };
        barbersMap.remove(id); barbersMap.add(id, u); #ok(u);
      };
    };
  };
  public shared func toggleBarberActive(id : Nat) : async { #ok : Barber; #err : Text } {
    switch (barbersMap.get(id)) {
      case null { #err("Barbero no encontrado") };
      case (?e) {
        let u : Barber = { id=e.id; name=e.name; active=not e.active; workDays=e.workDays; startTime=e.startTime; endTime=e.endTime };
        barbersMap.remove(id); barbersMap.add(id, u); #ok(u);
      };
    };
  };

  // ─────────────────────────────────────────────────────────────
  // APPOINTMENTS
  // ─────────────────────────────────────────────────────────────
  public shared ({ caller }) func createAppointment(
    serviceId : Nat, serviceName : Text, clientName : Text,
    date : Text, time : Text, barberId : Nat, barberName : Text
  ) : async { #ok : Appointment; #err : Text } {
    let conflict = appointmentsMap.values().any(
      func(a) { a.date == date and a.time == time and a.barberId == barberId and a.status != "cancelled" }
    );
    if (conflict) { return #err("Horario no disponible para este barbero") };
    let appt : Appointment = {
      id=appointmentId; serviceId; serviceName; clientName;
      date; time; status="scheduled"; createdAt=Time.now();
      owner=caller; barberId; barberName;
    };
    appointmentsMap.add(appointmentId, appt);
    appointmentId += 1;
    #ok(appt);
  };
  public query ({ caller }) func getMyAppointments() : async [Appointment] {
    appointmentsMap.values().filter(func(a) { a.owner == caller }).toArray();
  };
  public query func getAllAppointments() : async [Appointment] {
    appointmentsMap.values().toArray();
  };
  public shared func confirmAppointment(id : Nat) : async { #ok : Appointment; #err : Text } {
    switch (appointmentsMap.get(id)) {
      case null { #err("Reserva no encontrada") };
      case (?a) {
        if (a.status == "cancelled") { return #err("No se puede confirmar una reserva cancelada") };
        let u : Appointment = { id=a.id; serviceId=a.serviceId; serviceName=a.serviceName; clientName=a.clientName; date=a.date; time=a.time; status="confirmed"; createdAt=a.createdAt; owner=a.owner; barberId=a.barberId; barberName=a.barberName };
        appointmentsMap.remove(id); appointmentsMap.add(id, u); #ok(u);
      };
    };
  };
  public shared func completeAppointment(id : Nat) : async { #ok : Appointment; #err : Text } {
    switch (appointmentsMap.get(id)) {
      case null { #err("Reserva no encontrada") };
      case (?a) {
        if (a.status == "cancelled") { return #err("No se puede completar una reserva cancelada") };
        let u : Appointment = { id=a.id; serviceId=a.serviceId; serviceName=a.serviceName; clientName=a.clientName; date=a.date; time=a.time; status="completed"; createdAt=a.createdAt; owner=a.owner; barberId=a.barberId; barberName=a.barberName };
        appointmentsMap.remove(id); appointmentsMap.add(id, u); #ok(u);
      };
    };
  };
  public shared func cancelAppointment(id : Nat) : async { #ok : Appointment; #err : Text } {
    switch (appointmentsMap.get(id)) {
      case null { return #err("Reserva no encontrada") };
      case (?a) {
        if (a.status == "completed") { return #err("No se puede cancelar una reserva completada") };
        let u : Appointment = { id=a.id; serviceId=a.serviceId; serviceName=a.serviceName; clientName=a.clientName; date=a.date; time=a.time; status="cancelled"; createdAt=a.createdAt; owner=a.owner; barberId=a.barberId; barberName=a.barberName };
        appointmentsMap.remove(id); appointmentsMap.add(id, u); #ok(u);
      };
    };
  };
  public query func checkSlotAvailableForBarber(date : Text, time : Text, barberId : Nat) : async Bool {
    not appointmentsMap.values().any(
      func(a) { a.date == date and a.time == time and a.barberId == barberId and a.status != "cancelled" }
    );
  };
  public query func checkSlotAvailable(date : Text, time : Text) : async Bool {
    not appointmentsMap.values().any(
      func(a) { a.date == date and a.time == time and a.status != "cancelled" }
    );
  };

  public type DayStat = { day : Nat; count : Nat };
  public query func getAppointmentStats(month : Nat, year : Nat, category : Text, barberId : Nat) : async [DayStat] {
    let monthStr = if (month < 10) { "0" # month.toText() } else { month.toText() };
    let prefix = year.toText() # "-" # monthStr # "-";
    let counts = Map.empty<Nat, Nat>();
    for (appt in appointmentsMap.values()) {
      if (appt.date.startsWith(#text prefix)) {
        let matchesCategory = category == "all" or (
          switch (servicesMap.get(appt.serviceId)) {
            case null { false };
            case (?svc) { svc.category == category };
          }
        );
        let matchesBarber = barberId == 0 or appt.barberId == barberId;
        if (matchesCategory and matchesBarber) {
          let parts = appt.date.split(#char '-').toArray();
          if (parts.size() == 3) {
            switch (Nat.fromText(parts[2])) {
              case null {};
              case (?d) {
                let prev = switch (counts.get(d)) { case null { 0 }; case (?v) { v } };
                counts.remove(d); counts.add(d, prev + 1);
              };
            };
          };
        };
      };
    };
    counts.entries().map(func((day, count)) { { day; count } }).toArray();
  };

  public type IncomeStats = { daily : Nat; monthly : Nat; annual : Nat };
  public query func getIncomeStats(todayDate : Text) : async IncomeStats {
    let parts = todayDate.split(#char '-').toArray();
    let yearStr  = if (parts.size() > 0) { parts[0] } else { "" };
    let monthStr = if (parts.size() > 1) { parts[1] } else { "" };
    let monthPrefix = yearStr # "-" # monthStr # "-";
    var daily : Nat = 0; var monthly : Nat = 0; var annual : Nat = 0;
    for (appt in appointmentsMap.values()) {
      if (appt.status == "confirmed" or appt.status == "completed") {
        let price = switch (servicesMap.get(appt.serviceId)) {
          case null { 0 }; case (?svc) { svc.priceAmount };
        };
        if (appt.date.startsWith(#text (yearStr # "-"))) {
          annual += price;
          if (appt.date.startsWith(#text monthPrefix)) {
            monthly += price;
            if (appt.date == todayDate) { daily += price };
          };
        };
      };
    };
    { daily; monthly; annual };
  };

  // ─────────────────────────────────────────────────────────────
  // BUSINESS CONFIG
  // ─────────────────────────────────────────────────────────────
  public type BusinessConfig = {
    workDays : [Nat]; startTime : Text; endTime : Text; blockedDates : [Text];
  };
  var businessConfig : BusinessConfig = {
    workDays=[1,2,3,4,5,6]; startTime="09:00"; endTime="19:00"; blockedDates=[];
  };
  public query func getBusinessConfig() : async BusinessConfig { businessConfig };
  public shared func updateBusinessConfig(
    workDays : [Nat], startTime : Text, endTime : Text, blockedDates : [Text]
  ) : async { #ok : BusinessConfig; #err : Text } {
    businessConfig := { workDays; startTime; endTime; blockedDates };
    #ok(businessConfig);
  };

  // ─────────────────────────────────────────────────────────────
  // GALLERY
  // ─────────────────────────────────────────────────────────────
  public type GalleryItem = { id : Nat; imageUrl : Text; title : Text; createdAt : Int };
  var galleryIdCounter = 1;
  var galleryMap = Map.empty<Nat, GalleryItem>();
  public query func getGalleryItems() : async [GalleryItem] { galleryMap.values().toArray() };
  public shared func addGalleryItem(imageUrl : Text, title : Text) : async { #ok : GalleryItem; #err : Text } {
    let id = galleryIdCounter; galleryIdCounter += 1;
    let item : GalleryItem = { id; imageUrl; title; createdAt=Time.now() };
    galleryMap.add(id, item); #ok(item);
  };
  public shared func deleteGalleryItem(id : Nat) : async { #ok; #err : Text } {
    switch (galleryMap.get(id)) {
      case null { #err("Imagen no encontrada") }; case (?_) { galleryMap.remove(id); #ok };
    };
  };

  // ─────────────────────────────────────────────────────────────
  // PROMOTIONS
  // ─────────────────────────────────────────────────────────────
  public type Promotion = {
    id : Nat; title : Text; description : Text;
    active : Bool; startDate : Text; endDate : Text;
  };
  var promoIdCounter = 1;
  var promotionsMap = Map.empty<Nat, Promotion>();
  public query func getPromotions() : async [Promotion] { promotionsMap.values().toArray() };
  public shared func addPromotion(
    title : Text, description : Text, startDate : Text, endDate : Text
  ) : async { #ok : Promotion; #err : Text } {
    let id = promoIdCounter; promoIdCounter += 1;
    let p : Promotion = { id; title; description; active=true; startDate; endDate };
    promotionsMap.add(id, p); #ok(p);
  };
  public shared func updatePromotion(
    id : Nat, title : Text, description : Text, active : Bool, startDate : Text, endDate : Text
  ) : async { #ok : Promotion; #err : Text } {
    switch (promotionsMap.get(id)) {
      case null { #err("Promoción no encontrada") };
      case (?_) {
        let u : Promotion = { id; title; description; active; startDate; endDate };
        promotionsMap.remove(id); promotionsMap.add(id, u); #ok(u);
      };
    };
  };
  public shared func deletePromotion(id : Nat) : async { #ok; #err : Text } {
    switch (promotionsMap.get(id)) {
      case null { #err("Promoción no encontrada") }; case (?_) { promotionsMap.remove(id); #ok };
    };
  };
};
