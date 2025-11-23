import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { User } from '../interfaces';

export interface AuthState {
    users: User[];
    currentUser: User | null;
    selectedUser: User | null;
}

export const initialAuthState: AuthState = {
    users: [],
    currentUser: null,
    selectedUser: null,
};

export const AuthStore = signalStore(
    {providedIn: 'root'},
    withState(initialAuthState),
    withComputed(({currentUser, selectedUser}) => ({
        isLoggedIn: computed(() => !!currentUser()),
        isAdmin: computed(() => !!currentUser()?.isAdmin),
        isSelectedIsCurrent: computed(() => currentUser()?.username === selectedUser()?.username),
        selectedUsername: computed(() => selectedUser()?.username)
    })),
    withMethods((store) => ({
        setUsers(users: User[]) {
            patchState(store, {users: users.map(_mapUserDates)});
        },
        setCurrentUser(user: User | null) {
            if (user) {
                patchState(store, {currentUser: _mapUserDates(user)});
            } else {
                patchState(store, {currentUser: null});
            }
        },
        setSelectedUser(user: User | null) {
            if (user) {
                patchState(store, {selectedUser: _mapUserDates(user)});
            } else {
                patchState(store, {selectedUser: null});
            }
        }
    }))
);

function _mapUserDates(user: User): User {
    return {
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
    };
}
