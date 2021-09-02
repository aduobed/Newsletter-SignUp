const {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} = require("@firebase/auth");
const { collection, getFirestore, getDocs, setDoc, query} = require("@firebase/firestore");

const auth = getAuth();
const firestore = getFirestore();
const SUBSCRIPTION_COLLECTION_NAME = "subscriptions"

exports.signIn = async (email, password) => {
  if (auth.currentUser) {
    await signOut();
  }
  try {
    const signInResult = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return Boolean(signInResult.user);
  } catch (error) {
    return false;
  }
};

exports.signOut = async () => {
  if (auth.currentUser) {
    await signOut(auth);
  }
};

exports.isUserSignedIn = () => {
  return Boolean(auth.currentUser);
};

exports.addSubscription = async (firstName, lastName, email, phone) => {
  await setDoc(doc(firestore, SUBSCRIPTION_COLLECTION_NAME, email),  {
    firstName,
    lastName,
    email,
    phone,
    createdAt: +Date.now(),
    lastModifiedAt: +Date.now(),
  });
}

exports.getSubscriptionByEmail = async (email) => {
  const q = query(collection(db, SUBSCRIPTION_COLLECTION_NAME), where("email", "==", email));
  const snapshot = await getDocs(q);

  if (snapshot.docs && snapshot.docs.length) {
    return snapshot.docs[0].data();
  }

  return null;
}

exports.getSubscriptions = async (numberOfDays) => {
  // Get timestamp for arbitrary date (using number of days in the past)
  const queryTimestamp = new Date().setDate(((new Date()).getDate() - numberOfDays))

  const q = query(collection(db, SUBSCRIPTION_COLLECTION_NAME), where("createdAt", ">", queryTimestamp));
  const snapshot = await getDocs(q);

  const list  = [];
  snapshot.forEach(s => {
    list.push(s.data());
  });

  return list;
}
