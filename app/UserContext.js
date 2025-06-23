import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SQLite from 'expo-sqlite';

const UserContext = createContext();

const DB_NAME = 'heartgo_users.db';
const TARGET_DB_VERSION = 2;

// Default users - will be loaded from database
const DEFAULT_USERS = [
    {
        id: 1,
        name: 'John Doe',
        gender: 'male',
        height: '175 cm',
        weight: '70 kg',
        birthday: '1979-03-15',
        tableName: 'user_john_doe'
    },
];

export const UserProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [db, setDb] = useState(null);

    useEffect(() => {
        initializeDatabase();
    }, []);

    const initializeDatabase = async () => {
        try {
            console.log('🚀 Initializing HeartGo central database...');
            const database = await SQLite.openDatabaseAsync(DB_NAME);
            setDb(database);

            // Set WAL journal for better performance
            await database.runAsync('PRAGMA journal_mode = WAL;');
            console.log('📊 Database opened with WAL mode');

            // Create users table
            await database.runAsync(`
                CREATE TABLE IF NOT EXISTS users (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  gender TEXT NOT NULL,
                  height TEXT NOT NULL,
                  weight TEXT NOT NULL,
                  birthday TEXT NOT NULL,
                  tableName TEXT UNIQUE NOT NULL,
                  created_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ Users table created/verified');

            // Check if we have any users
            const existingUsers = await database.getAllAsync('SELECT * FROM users ORDER BY id;');
            console.log(`👥 Found ${existingUsers.length} existing users in database`);

            if (existingUsers.length === 0) {
                console.log('🔧 No users found, creating default user...');
                // Insert default user
                await addUserToDatabase(database, DEFAULT_USERS[0]);
                const users = await database.getAllAsync('SELECT * FROM users ORDER BY id;');
                setUsers(users);
                setCurrentUser(users[0]);
                console.log(`✅ Default user created: ${users[0].name}`);
            } else {
                setUsers(existingUsers);
                setCurrentUser(existingUsers[0]);
                console.log(`✅ Loaded existing users, current: ${existingUsers[0].name}`);
            }

            // Ensure all user tables exist with correct schema
            const allUsers = existingUsers.length > 0 ? existingUsers : [DEFAULT_USERS[0]];
            for (const user of allUsers) {
                await createUserTable(database, user.tableName);
            }

            console.log('🎉 Database initialization completed successfully!');

        } catch (error) {
            console.error("❌ Database initialization error:", error);
        }
    };

    const createUserTable = async (database, tableName) => {
        try {
            await database.runAsync(`
                CREATE TABLE IF NOT EXISTS ${tableName} (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  heartbeat REAL NOT NULL,
                  qt REAL NOT NULL,
                  qrs REAL NOT NULL,
                  heartvariance REAL NOT NULL,
                  timestamp TEXT NOT NULL,
                  metadata TEXT,
                  filename TEXT
                );
            `);
            console.log(`✅ Table created/verified: ${tableName}`);

            // Check if filename column exists, add it if it doesn't (for existing tables)
            const tableInfo = await database.getAllAsync(`PRAGMA table_info(${tableName});`);
            const hasFilename = tableInfo.some(col => col.name === 'filename');

            if (!hasFilename) {
                await database.runAsync(`ALTER TABLE ${tableName} ADD COLUMN filename TEXT;`);
                console.log(`✅ Added filename column to existing table: ${tableName}`);
            }

            // Verify the table structure
            console.log(`📋 Table ${tableName} columns:`, tableInfo.map(col => `${col.name}(${col.type})`).join(', '));

        } catch (error) {
            console.error(`❌ Error creating table ${tableName}:`, error);
        }
    };

    const generateTableName = (name) => {
        return 'user_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    };

    const addUserToDatabase = async (database, userData) => {
        const tableName = generateTableName(userData.name);
        console.log(`👤 Adding new user: ${userData.name} with table: ${tableName}`);

        // Insert user record
        await database.runAsync(`
            INSERT INTO users (name, gender, height, weight, birthday, tableName)
            VALUES (?, ?, ?, ?, ?, ?);
        `, userData.name, userData.gender, userData.height, userData.weight, userData.birthday, tableName);

        // Create the user's data table
        await createUserTable(database, tableName);
        console.log(`✅ User added successfully: ${userData.name}`);
    };

    const addUser = async (userData) => {
        if (!db) {
            console.error('❌ Database not available for adding user');
            return false;
        }

        try {
            await addUserToDatabase(db, userData);

            // Refresh users list
            const users = await db.getAllAsync('SELECT * FROM users ORDER BY id;');
            setUsers(users);
            console.log(`✅ User list refreshed, total users: ${users.length}`);

            return true;
        } catch (error) {
            console.error("❌ Add user error:", error);
            return false;
        }
    };

    const deleteUser = async (userId) => {
        try {
            if (!db) {
                console.error('❌ Database not available');
                return false;
            }

            // Get user info before deletion for logging
            const userToDelete = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', userId);
            if (!userToDelete) {
                console.error('❌ User not found for deletion');
                return false;
            }

            console.log(`🗑️ DELETING USER: ${userToDelete.name} (ID: ${userId}, Table: ${userToDelete.tableName})`);

            // If this is the current user, switch to another user first
            if (currentUser && currentUser.id === userId) {
                const otherUsers = await db.getAllAsync('SELECT * FROM users WHERE id != ? ORDER BY id LIMIT 1', userId);
                if (otherUsers.length > 0) {
                    console.log(`🔄 Switching current user from ${currentUser.name} to ${otherUsers[0].name}`);
                    setCurrentUser(otherUsers[0]);
                }
            }

            // Drop the user's data table
            try {
                await db.runAsync(`DROP TABLE IF EXISTS ${userToDelete.tableName};`);
                console.log(`✅ Dropped data table: ${userToDelete.tableName}`);
            } catch (tableError) {
                console.error(`❌ Error dropping table ${userToDelete.tableName}:`, tableError);
            }

            // Delete user from users table
            await db.runAsync('DELETE FROM users WHERE id = ?', userId);
            console.log(`✅ Removed user from users table: ${userToDelete.name}`);

            // Refresh users list
            const updatedUsers = await db.getAllAsync('SELECT * FROM users ORDER BY id');
            setUsers(updatedUsers);

            console.log(`🎉 USER DELETION COMPLETED! ${userToDelete.name} has been permanently removed.`);
            console.log(`📊 Remaining users: ${updatedUsers.length}/3`);

            return true;
        } catch (error) {
            console.error('❌ Error deleting user:', error);
            return false;
        }
    };

    const switchUser = (userId) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            console.log(`🔄 Switching user from ${currentUser?.name} to ${user.name}`);
            setCurrentUser(user);
        }
    };

    return (
        <UserContext.Provider value={{
            currentUser,
            users,
            db,
            switchUser,
            addUser,
            deleteUser,
            getCurrentUserTable: () => currentUser?.tableName || 'user_default'
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
