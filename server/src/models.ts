import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './db';

// --- User Model ---
interface UserAttributes {
  id: string;
  username: string;
  role: 'admin' | 'commercial';
  name: string;
  password?: string; // In a real app, this should be hashed
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public username!: string;
  public role!: 'admin' | 'commercial';
  public name!: string;
  public password!: string;
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  role: {
    type: DataTypes.ENUM('admin', 'commercial'),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true, // Allow null for now if we just want to sync existing users without passwords or something
  }
}, {
  sequelize,
  tableName: 'users',
});

// --- Client Model ---
interface ClientAttributes {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  contactName?: string;
  phones: string[]; // Stored as JSON
  emails: string[]; // Stored as JSON
  totalTimeSpentMinutes: number;
  visitIds: string[]; // Stored as JSON, though we have a relation too
}

interface ClientCreationAttributes extends Optional<ClientAttributes, 'id' | 'contactName' | 'phones' | 'emails' | 'totalTimeSpentMinutes' | 'visitIds'> {}

export class Client extends Model<ClientAttributes, ClientCreationAttributes> implements ClientAttributes {
  public id!: string;
  public name!: string;
  public address!: string;
  public lat!: number;
  public lng!: number;
  public contactName!: string;
  public phones!: string[];
  public emails!: string[];
  public totalTimeSpentMinutes!: number;
  public visitIds!: string[];
}

Client.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lat: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  lng: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  contactName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phones: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  emails: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  totalTimeSpentMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  visitIds: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  }
}, {
  sequelize,
  tableName: 'clients',
});

// --- Visit Model ---
interface VisitAttributes {
  id: string;
  clientId?: string;
  placeId: string;
  placeName: string;
  placeAddress: string;
  timestamp: number;
  feedback: string;
  status: 'aceptado' | 'rechazado' | 'propuesta';
  tags: string[]; // JSON
  lat: number;
  lng: number;
  durationMinutes: number;
}

interface VisitCreationAttributes extends Optional<VisitAttributes, 'id' | 'clientId' | 'tags'> {}

export class Visit extends Model<VisitAttributes, VisitCreationAttributes> implements VisitAttributes {
  public id!: string;
  public clientId!: string;
  public placeId!: string;
  public placeName!: string;
  public placeAddress!: string;
  public timestamp!: number;
  public feedback!: string;
  public status!: 'aceptado' | 'rechazado' | 'propuesta';
  public tags!: string[];
  public lat!: number;
  public lng!: number;
  public durationMinutes!: number;
}

Visit.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  placeId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  placeName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  placeAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('aceptado', 'rechazado', 'propuesta'),
    allowNull: false,
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  lat: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  lng: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  }
}, {
  sequelize,
  tableName: 'visits',
});

// --- Expense Model ---
interface ExpenseAttributes {
  id: string;
  clientId?: string;
  visitId?: string;
  amount: number;
  concept: string;
  date: number;
}

interface ExpenseCreationAttributes extends Optional<ExpenseAttributes, 'id' | 'clientId' | 'visitId'> {}

export class Expense extends Model<ExpenseAttributes, ExpenseCreationAttributes> implements ExpenseAttributes {
  public id!: string;
  public clientId!: string;
  public visitId!: string;
  public amount!: number;
  public concept!: string;
  public date!: number;
}

Expense.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  visitId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  concept: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.BIGINT,
    allowNull: false,
  }
}, {
  sequelize,
  tableName: 'expenses',
});

// --- Document Model ---
interface DocumentAttributes {
  id: string;
  clientId?: string;
  visitId?: string;
  name: string;
  type: 'pdf' | 'img' | 'doc' | 'audio';
  date: number;
  data?: string; // Base64
}

interface DocumentCreationAttributes extends Optional<DocumentAttributes, 'id' | 'clientId' | 'visitId' | 'data'> {}

export class Document extends Model<DocumentAttributes, DocumentCreationAttributes> implements DocumentAttributes {
  public id!: string;
  public clientId!: string;
  public visitId!: string;
  public name!: string;
  public type!: 'pdf' | 'img' | 'doc' | 'audio';
  public date!: number;
  public data!: string;
}

Document.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  visitId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('pdf', 'img', 'doc', 'audio'),
    allowNull: false,
  },
  date: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  data: {
    type: DataTypes.TEXT('long'), // Use LONGTEXT for base64 strings
    allowNull: true,
  }
}, {
  sequelize,
  tableName: 'documents',
});

// --- Contact Model ---
interface ContactAttributes {
  id: string;
  clientId: string;
  name: string;
  role: string;
  phone: string;
  email: string;
}

interface ContactCreationAttributes extends Optional<ContactAttributes, 'id'> {}

export class Contact extends Model<ContactAttributes, ContactCreationAttributes> implements ContactAttributes {
  public id!: string;
  public clientId!: string;
  public name!: string;
  public role!: string;
  public phone!: string;
  public email!: string;
}

Contact.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  sequelize,
  tableName: 'contacts',
});

// --- Associations ---
Client.hasMany(Contact, { foreignKey: 'clientId', as: 'contacts' });
Contact.belongsTo(Client, { foreignKey: 'clientId' });

Client.hasMany(Visit, { foreignKey: 'clientId', as: 'visits' });
Visit.belongsTo(Client, { foreignKey: 'clientId' });

Client.hasMany(Expense, { foreignKey: 'clientId', as: 'expenses' });
Expense.belongsTo(Client, { foreignKey: 'clientId' });

Visit.hasMany(Expense, { foreignKey: 'visitId', as: 'expenses' });
Expense.belongsTo(Visit, { foreignKey: 'visitId' });

Client.hasMany(Document, { foreignKey: 'clientId', as: 'documents' });
Document.belongsTo(Client, { foreignKey: 'clientId' });

Visit.hasMany(Document, { foreignKey: 'visitId', as: 'documents' });
Document.belongsTo(Visit, { foreignKey: 'visitId' });
