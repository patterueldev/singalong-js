import { Db, ObjectId } from "mongodb";
import { Room, User, Song, ReservedSong, SongDraft } from "singalong-shared";

// Helper to convert MongoDB docs to domain models
function docToModel<T>(doc: any): T {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest } as T;
}

export class RoomRepository {
  constructor(private db: Db) {}

  async create(room: Omit<Room, "id">): Promise<Room> {
    const result = await this.db.collection("rooms").insertOne({
      _id: new ObjectId(),
      ...room,
    });
    return { id: result.insertedId.toString(), ...room };
  }

  async findById(id: string): Promise<Room | null> {
    const doc = await this.db.collection("rooms").findOne({ _id: new ObjectId(id) });
    if (!doc) return null;
    return docToModel<Room>(doc);
  }

  async findByRoomNumber(roomNumber: string): Promise<Room | null> {
    const doc = await this.db.collection("rooms").findOne({ roomNumber });
    if (!doc) return null;
    return docToModel<Room>(doc);
  }

  async update(id: string, updates: Partial<Room>): Promise<boolean> {
    const result = await this.db.collection("rooms").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    return result.modifiedCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.collection("rooms").deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  async findAllActive(): Promise<Room[]> {
    const docs = await this.db.collection("rooms").find({ status: "active" }).toArray();
    return docs.map(doc => docToModel<Room>(doc));
  }
}

export class UserRepository {
  constructor(private db: Db) {}

  async create(user: Omit<User, "id">): Promise<User> {
    const result = await this.db.collection("users").insertOne({
      _id: new ObjectId(),
      ...user,
    });
    return { id: result.insertedId.toString(), ...user };
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.db.collection("users").findOne({ _id: new ObjectId(id) });
    if (!doc) return null;
    return docToModel<User>(doc);
  }

  async findByNickname(nickname: string): Promise<User | null> {
    const doc = await this.db.collection("users").findOne({ nickname });
    if (!doc) return null;
    return docToModel<User>(doc);
  }

  async update(id: string, updates: Partial<User>): Promise<boolean> {
    const result = await this.db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    return result.modifiedCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.collection("users").deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  async findByRoomId(roomId: string): Promise<User[]> {
    const docs = await this.db.collection("users").find({ roomId }).toArray();
    return docs.map(doc => docToModel<User>(doc));
  }
}

export class SongRepository {
  constructor(private db: Db) {}

  async create(song: Omit<Song, "id">): Promise<Song> {
    const result = await this.db.collection("songs").insertOne({
      _id: new ObjectId(),
      ...song,
    });
    return { id: result.insertedId.toString(), ...song };
  }

  async findById(id: string): Promise<Song | null> {
    const doc = await this.db.collection("songs").findOne({ _id: new ObjectId(id) });
    if (!doc) return null;
    return docToModel<Song>(doc);
  }

  async findByProviderId(provider: string, providerId: string): Promise<Song | null> {
    const doc = await this.db.collection("songs").findOne({ provider, providerId });
    if (!doc) return null;
    return docToModel<Song>(doc);
  }

  async search(query: string, limit: number = 50): Promise<Song[]> {
    const docs = await this.db.collection("songs")
      .find({ $text: { $search: query } })
      .limit(limit)
      .toArray();
    return docs.map(doc => docToModel<Song>(doc));
  }

  async update(id: string, updates: Partial<Song>): Promise<boolean> {
    const result = await this.db.collection("songs").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    return result.modifiedCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.collection("songs").deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
}

export class QueueRepository {
  constructor(private db: Db) {}

  async create(item: Omit<ReservedSong, "id">): Promise<ReservedSong> {
    const result = await this.db.collection("queue_items").insertOne({
      _id: new ObjectId(),
      ...item,
    });
    return { id: result.insertedId.toString(), ...item };
  }

  async findById(id: string): Promise<ReservedSong | null> {
    const doc = await this.db.collection("queue_items").findOne({ _id: new ObjectId(id) });
    if (!doc) return null;
    return docToModel<ReservedSong>(doc);
  }

  async findByRoomId(roomId: string): Promise<ReservedSong[]> {
    const docs = await this.db.collection("queue_items")
      .find({ roomId, status: { $in: ["pending", "playing"] } })
      .sort({ addedAt: 1 })
      .toArray();
    return docs.map(doc => docToModel<ReservedSong>(doc));
  }

  async update(id: string, updates: Partial<ReservedSong>): Promise<boolean> {
    const result = await this.db.collection("queue_items").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    return result.modifiedCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.collection("queue_items").deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
}

export class SongDraftRepository {
  constructor(private db: Db) {}

  async create(draft: Omit<SongDraft, "id">): Promise<SongDraft> {
    const result = await this.db.collection("songDrafts").insertOne({
      _id: new ObjectId(),
      ...draft,
    });
    return { id: result.insertedId.toString(), ...draft };
  }

  async findById(id: string): Promise<SongDraft | null> {
    const doc = await this.db.collection("songDrafts").findOne({ _id: new ObjectId(id) });
    if (!doc) return null;
    return docToModel<SongDraft>(doc);
  }

  async update(id: string, updates: Partial<SongDraft>): Promise<boolean> {
    const result = await this.db.collection("songDrafts").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    return result.modifiedCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.collection("songDrafts").deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
}
