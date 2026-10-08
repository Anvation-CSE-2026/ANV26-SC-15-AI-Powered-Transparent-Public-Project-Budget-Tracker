/**
 * Maps Firebase Auth and Firestore error codes to clear, friendly user messages.
 */
export function getFriendlyAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email/username or password is incorrect. Please verify your credentials.';

    case 'auth/email-already-in-use':
      return 'An account with this email address is already registered.';

    case 'auth/username-already-taken':
      return 'This username is already taken. Please choose another username.';

    case 'auth/invalid-email':
      return 'Please enter a valid email address.';

    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters with letters and numbers.';

    case 'auth/user-disabled':
      return 'This account has been deactivated by the system administrator.';

    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Access temporarily restricted for security. Please try again later.';

    case 'auth/network-request-failed':
      return 'Network communication failed. Please check your internet connection.';

    case 'auth/popup-closed-by-user':
      return 'The authentication popup was closed before completing the sign in.';

    case 'auth/requires-recent-login':
      return 'This operation is sensitive and requires recent authentication. Please log in again.';

    case 'auth/missing-identifier':
      return 'Please provide an email or username.';

    case 'auth/missing-password':
      return 'Please enter your password.';

    case 'auth/profile-not-found':
      return 'User profile record could not be found in the database. Please contact municipal support.';

    default:
      return 'An unexpected authentication error occurred. Please try again.';
  }
}
