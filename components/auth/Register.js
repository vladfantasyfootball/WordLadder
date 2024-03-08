import React, { Component } from 'react';
import { View, Button, TextInput } from 'react-native'; 
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import {setDoc, doc, getFirestore } from 'firebase/firestore';

export class RegisterScreen extends Component {
    constructor(props) {
        super(props);

        this.state = {
            email: '',
            password: '',
            name: '',
        }

        this.onSignUp = this.onSignUp.bind(this)
    }

    onSignUp() {
        const { email, name, password} = this.state;
        const auth = getAuth();
        const db = getFirestore();
        createUserWithEmailAndPassword(auth, email, password)
            .then((result) => {
                setDoc(doc(db, "users", auth.currentUser.uid), {
                    name,
                    email
                  });
            })
            .catch((error) => {
                console.log(error);
            })
    }
    render() {
        return (
            <View>
                <TextInput 
                    placeholder='name'
                    onChangeText={(name) => this.setState({ name })}
                />
                <TextInput 
                    placeholder='email'
                    onChangeText={(email) => this.setState({ email })}
                />
                <TextInput 
                    placeholder='password'
                    secureTextEntry={true}
                    onChangeText={(password) => this.setState({ password })}
                />

                <Button 
                    onPress={() => this.onSignUp()}
                    title="Sign Up"
                />
            </View>
        )
    }
}

export default RegisterScreen