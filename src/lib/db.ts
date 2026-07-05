import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Database Entity Interfaces
export interface Profile {
  id: string;
  updated_at?: string;
  full_name?: string;
  avatar_url?: string;
  website?: string;
}

export interface Location {
  id: string;
  user_id?: string;
  name: string;
  address?: string;
  timezone: string;
  created_at?: string;
}

export interface Client {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  membership_tier: string; // 'None' | 'Starter' | 'Pro' | 'Studio' | 'VIP'
  join_date: string;
  notes?: string;
  is_active: boolean;
}

export interface ClassType {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  duration_minutes: number;
  capacity: number;
  price: number;
  color: string;
}

export interface Staff {
  id: string;
  user_id?: string;
  name: string;
  email?: string;
  specialties?: string; // e.g. 'Yoga, Pilates'
  is_active: boolean;
  created_at?: string;
}

export interface ClassSchedule {
  id: string;
  class_type_id: string;
  instructor_id?: string;
  start_time: string; // e.g. '09:00'
  end_time: string; // e.g. '10:00'
  location_id: string;
  is_recurring: boolean;
  day_of_week: number; // 0-6 (0=Sunday, 1=Monday, etc.)
}

export interface ClassInstance {
  id: string;
  class_schedule_id: string;
  date: string; // 'YYYY-MM-DD'
  is_cancelled: boolean;
  cancellation_reason?: string;
}

export interface Booking {
  id: string;
  client_id: string;
  class_instance_id: string;
  status: 'booked' | 'waitlist' | 'cancelled';
  booked_at: string;
  checked_in_at?: string;
}

export interface Payment {
  id: string;
  client_id: string;
  user_id?: string;
  amount: number;
  currency: string;
  method: string; // 'cash' | 'card' | 'M-Pesa'
  description?: string;
  paid_at: string;
}

export interface Membership {
  id: string;
  client_id: string;
  plan_name: string; // 'Starter' | 'Pro' | 'Studio'
  price: number;
  billing_cycle: string; // 'monthly'
  start_date: string;
  end_date?: string;
  stripe_subscription_id?: string;
}

export interface MockDBStore {
  profiles: Profile[];
  locations: Location[];
  clients: Client[];
  class_types: ClassType[];
  staff: Staff[];
  class_schedule: ClassSchedule[];
  class_instances: ClassInstance[];
  bookings: Booking[];
  payments: Payment[];
  memberships: Membership[];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!)
  : null;

const MOCK_DB_PATH = path.join(process.cwd(), 'src', 'lib', 'mock_db_store.json');

export function readMockDB(): MockDBStore {
  try {
    if (!fs.existsSync(MOCK_DB_PATH)) {
      return {
        profiles: [],
        locations: [],
        clients: [],
        class_types: [],
        staff: [],
        class_schedule: [],
        class_instances: [],
        bookings: [],
        payments: [],
        memberships: []
      };
    }
    const data = fs.readFileSync(MOCK_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading mock DB:", error);
    return {
      profiles: [],
      locations: [],
      clients: [],
      class_types: [],
      staff: [],
      class_schedule: [],
      class_instances: [],
      bookings: [],
      payments: [],
      memberships: []
    };
  }
}

export function writeMockDB(data: MockDBStore) {
  try {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing to mock DB:", error);
  }
}

// Database helper functions
export const db = {
  locations: {
    list: async (): Promise<Location[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('locations').select('*');
        if (error) throw error;
        return data || [];
      }
      return readMockDB().locations;
    },
    get: async (id: string): Promise<Location | null> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('locations').select('*').eq('id', id).single();
        if (error) return null;
        return data;
      }
      return readMockDB().locations.find(l => l.id === id) || null;
    },
    save: async (location: Omit<Location, 'id'> & { id?: string }): Promise<Location> => {
      const id = location.id || `loc-${Math.random().toString(36).substr(2, 9)}`;
      const newLoc = { ...location, id } as Location;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('locations').upsert(newLoc).select().single();
        if (error) throw error;
        return data;
      }
      const store = readMockDB();
      const index = store.locations.findIndex(l => l.id === id);
      if (index > -1) store.locations[index] = newLoc;
      else store.locations.push(newLoc);
      writeMockDB(store);
      return newLoc;
    }
  },

  clients: {
    list: async (): Promise<Client[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('clients').select('*');
        if (error) throw error;
        return data || [];
      }
      return readMockDB().clients;
    },
    get: async (id: string): Promise<Client | null> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
        if (error) return null;
        return data;
      }
      return readMockDB().clients.find(c => c.id === id) || null;
    },
    save: async (client: Omit<Client, 'id'> & { id?: string }): Promise<Client> => {
      const id = client.id || `client-${Math.random().toString(36).substr(2, 9)}`;
      const newClient = { ...client, id } as Client;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('clients').upsert(newClient).select().single();
        if (error) throw error;
        return data;
      }
      const store = readMockDB();
      const index = store.clients.findIndex(c => c.id === id);
      if (index > -1) store.clients[index] = newClient;
      else store.clients.push(newClient);
      writeMockDB(store);
      return newClient;
    }
  },

  classTypes: {
    list: async (): Promise<ClassType[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('class_types').select('*');
        if (error) throw error;
        return data || [];
      }
      return readMockDB().class_types;
    },
    get: async (id: string): Promise<ClassType | null> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('class_types').select('*').eq('id', id).single();
        if (error) return null;
        return data;
      }
      return readMockDB().class_types.find(c => c.id === id) || null;
    },
    save: async (classType: Omit<ClassType, 'id'> & { id?: string }): Promise<ClassType> => {
      const id = classType.id || `ct-${Math.random().toString(36).substr(2, 9)}`;
      const newCT = { ...classType, id } as ClassType;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('class_types').upsert(newCT).select().single();
        if (error) throw error;
        return data;
      }
      const store = readMockDB();
      const index = store.class_types.findIndex(c => c.id === id);
      if (index > -1) store.class_types[index] = newCT;
      else store.class_types.push(newCT);
      writeMockDB(store);
      return newCT;
    }
  },

  staff: {
    list: async (): Promise<Staff[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('staff').select('*');
        if (error) throw error;
        return data || [];
      }
      return readMockDB().staff;
    },
    get: async (id: string): Promise<Staff | null> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('staff').select('*').eq('id', id).single();
        if (error) return null;
        return data;
      }
      return readMockDB().staff.find(s => s.id === id) || null;
    },
    save: async (staff: Omit<Staff, 'id'> & { id?: string }): Promise<Staff> => {
      const id = staff.id || `staff-${Math.random().toString(36).substr(2, 9)}`;
      const newStaff = { ...staff, id } as Staff;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('staff').upsert(newStaff).select().single();
        if (error) throw error;
        return data;
      }
      const store = readMockDB();
      const index = store.staff.findIndex(s => s.id === id);
      if (index > -1) store.staff[index] = newStaff;
      else store.staff.push(newStaff);
      writeMockDB(store);
      return newStaff;
    }
  },

  classSchedule: {
    list: async (): Promise<ClassSchedule[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('class_schedule').select('*');
        if (error) throw error;
        return data || [];
      }
      return readMockDB().class_schedule;
    },
    get: async (id: string): Promise<ClassSchedule | null> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('class_schedule').select('*').eq('id', id).single();
        if (error) return null;
        return data;
      }
      return readMockDB().class_schedule.find(s => s.id === id) || null;
    },
    save: async (schedule: Omit<ClassSchedule, 'id'> & { id?: string }): Promise<ClassSchedule> => {
      const id = schedule.id || `sched-${Math.random().toString(36).substr(2, 9)}`;
      const newSched = { ...schedule, id } as ClassSchedule;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('class_schedule').upsert(newSched).select().single();
        if (error) throw error;
        return data;
      }
      const store = readMockDB();
      const index = store.class_schedule.findIndex(s => s.id === id);
      if (index > -1) store.class_schedule[index] = newSched;
      else store.class_schedule.push(newSched);
      writeMockDB(store);
      return newSched;
    }
  },

  classInstances: {
    list: async (): Promise<ClassInstance[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('class_instances').select('*');
        if (error) throw error;
        return data || [];
      }
      return readMockDB().class_instances;
    },
    get: async (id: string): Promise<ClassInstance | null> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('class_instances').select('*').eq('id', id).single();
        if (error) return null;
        return data;
      }
      return readMockDB().class_instances.find(c => c.id === id) || null;
    },
    save: async (instance: Omit<ClassInstance, 'id'> & { id?: string }): Promise<ClassInstance> => {
      const id = instance.id || `inst-${Math.random().toString(36).substr(2, 9)}`;
      const newInst = { ...instance, id } as ClassInstance;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('class_instances').upsert(newInst).select().single();
        if (error) throw error;
        return data;
      }
      const store = readMockDB();
      const index = store.class_instances.findIndex(c => c.id === id);
      if (index > -1) store.class_instances[index] = newInst;
      else store.class_instances.push(newInst);
      writeMockDB(store);
      return newInst;
    }
  },

  bookings: {
    list: async (): Promise<Booking[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('bookings').select('*');
        if (error) throw error;
        return data || [];
      }
      return readMockDB().bookings;
    },
    get: async (id: string): Promise<Booking | null> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single();
        if (error) return null;
        return data;
      }
      return readMockDB().bookings.find(b => b.id === id) || null;
    },
    save: async (booking: Omit<Booking, 'id'> & { id?: string }): Promise<Booking> => {
      const id = booking.id || `bk-${Math.random().toString(36).substr(2, 9)}`;
      const newBk = { ...booking, id } as Booking;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('bookings').upsert(newBk).select().single();
        if (error) throw error;
        return data;
      }
      const store = readMockDB();
      const index = store.bookings.findIndex(b => b.id === id);
      if (index > -1) store.bookings[index] = newBk;
      else store.bookings.push(newBk);
      writeMockDB(store);
      return newBk;
    },
    delete: async (id: string): Promise<boolean> => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('bookings').delete().eq('id', id);
        if (error) throw error;
        return true;
      }
      const store = readMockDB();
      const index = store.bookings.findIndex(b => b.id === id);
      if (index > -1) {
        store.bookings.splice(index, 1);
        writeMockDB(store);
        return true;
      }
      return false;
    }
  },

  payments: {
    list: async (): Promise<Payment[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('payments').select('*');
        if (error) throw error;
        return data || [];
      }
      return readMockDB().payments;
    },
    save: async (payment: Omit<Payment, 'id'> & { id?: string }): Promise<Payment> => {
      const id = payment.id || `pay-${Math.random().toString(36).substr(2, 9)}`;
      const newPay = { ...payment, id } as Payment;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('payments').upsert(newPay).select().single();
        if (error) throw error;
        return data;
      }
      const store = readMockDB();
      store.payments.push(newPay);
      writeMockDB(store);
      return newPay;
    }
  },

  memberships: {
    list: async (): Promise<Membership[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('memberships').select('*');
        if (error) throw error;
        return data || [];
      }
      return readMockDB().memberships;
    },
    getForClient: async (clientId: string): Promise<Membership | null> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('memberships').select('*').eq('client_id', clientId).maybeSingle();
        if (error) return null;
        return data;
      }
      return readMockDB().memberships.find(m => m.client_id === clientId) || null;
    },
    save: async (membership: Omit<Membership, 'id'> & { id?: string }): Promise<Membership> => {
      const id = membership.id || `memb-${Math.random().toString(36).substr(2, 9)}`;
      const newMemb = { ...membership, id } as Membership;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('memberships').upsert(newMemb).select().single();
        if (error) throw error;
        return data;
      }
      const store = readMockDB();
      const index = store.memberships.findIndex(m => m.id === id);
      if (index > -1) store.memberships[index] = newMemb;
      else store.memberships.push(newMemb);
      writeMockDB(store);
      return newMemb;
    }
  }
};

// Auto-generate class instances from schedule templates for a date range (YYYY-MM-DD)
export async function syncClassInstances(startDateStr: string, endDateStr: string): Promise<void> {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const schedules = await db.classSchedule.list();
  const instances = await db.classInstances.list();

  // Helper to format date as YYYY-MM-DD in local time
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0 = Sun, 1 = Mon, etc.
    const dateStr = formatDate(current);

    // Find templates for this day of week
    const dayTemplates = schedules.filter(s => s.day_of_week === dayOfWeek);

    for (const template of dayTemplates) {
      // Check if instance already exists
      const exists = instances.some(
        inst => inst.class_schedule_id === template.id && inst.date === dateStr
      );

      if (!exists) {
        await db.classInstances.save({
          class_schedule_id: template.id,
          date: dateStr,
          is_cancelled: false,
          cancellation_reason: ""
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }
}
