import detectEthereumProvider from "@metamask/detect-provider"
import { Strategy, ZkIdentity } from "@zk-kit/identity"
import { generateMerkleProof, Semaphore } from "@zk-kit/protocols"
import { providers } from "ethers"
import Head from "next/head"
import React from "react"
import styles from "../styles/Home.module.css"

// Import of necessary modules
import { createTheme, ThemeProvider } from "@mui/material/styles"
import * as Yup from 'yup'
import { Formik, getIn } from "formik"
import {
    Card,
    CardHeader,
    CardContent,
    CardActions,
    Divider,
    Grid,
    TextField,
    Button,
} from "@mui/material"

// initialization of theme for using material ui in style
const theme = createTheme()

export default function Home() {
    const [logs, setLogs] = React.useState("Connect your wallet and greet!")

    // variables name for form
    const initialValues = {
        name: {
            firstName: '',
            middleName: '',
            lastName: ''
        },
        age: '',
        address: ''
    }

    // using react usestate for greeting value
    const [greets, setGreeting] = React.useState("Greetings will go here")

    async function greet() {
        setLogs("Creating your Semaphore identity...")

        // setting the greeting value
        setGreeting("Greeting is in progress...")

        const provider = (await detectEthereumProvider()) as any

        await provider.request({ method: "eth_requestAccounts" })

        const ethersProvider = new providers.Web3Provider(provider)
        const signer = ethersProvider.getSigner()
        const message = await signer.signMessage("Sign this message to create your identity!")

        const identity = new ZkIdentity(Strategy.MESSAGE, message)
        const identityCommitment = identity.genIdentityCommitment()
        const identityCommitments = await (await fetch("./identityCommitments.json")).json()

        const merkleProof = generateMerkleProof(20, BigInt(0), identityCommitments, identityCommitment)

        setLogs("Creating your Semaphore proof...")
        setGreeting("Creating greeting...")

        const greeting = "Hello world"

        const witness = Semaphore.genWitness(
            identity.getTrapdoor(),
            identity.getNullifier(),
            merkleProof,
            merkleProof.root,
            greeting
        )

        const { proof, publicSignals } = await Semaphore.genProof(witness, "./semaphore.wasm", "./semaphore_final.zkey")
        const solidityProof = Semaphore.packToSolidityProof(proof)

        const response = await fetch("/api/greet", {
            method: "POST",
            body: JSON.stringify({
                greeting,
                nullifierHash: publicSignals.nullifierHash,
                solidityProof: solidityProof
            })
        })

        if (response.status === 500) {
            const errorMessage = await response.text()

            setLogs(errorMessage)
            setGreeting("Oops, no greeting due to error!")
        } else {
            setLogs("Your anonymous greeting is onchain :)")
            setGreeting(greeting)
        }
    }

    return (
        <div className={styles.container}>
            <Head>
                <title>Greetings from Bikash</title>
                <meta name="description" content="A simple Next.js/Hardhat privacy application with Semaphore." />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <h1 className={styles.title}>Greetings</h1>

                <p className={styles.description}>A simple Next.js/Hardhat privacy application with Semaphore.</p>

                <div className={styles.logs}>{logs}</div>

                <div onClick={() => greet()} className={styles.button}>
                    Greet
                </div>

                {/* listens for new greeting event and display it to the users */}
                <div className={styles.logs}>{greets}</div>

                {/* form having name, age and address field */}
                <ThemeProvider theme={theme}>
                    <Grid
                        container
                        justifyContent="center"
                        alignContent="center"
                        direction="row"
                    >
                        <Grid item xs={12} md={9}>
                            <Card>
                                <CardHeader title="SampleForm" />
                                <Divider />
                                <Formik
                                    initialValues={{
                                        ...initialValues
                                    }}
                                    validationSchema = {Yup.object().shape({
                                        name: Yup.object().shape({
                                            firstName: Yup.string()
                                                        .required("Please enter your first name")
                                                        .matches(/^[aA-zZ\s]+$/, "FirstName can only consists of alphabets"),
                                            lastName: Yup.string()
                                                        .required("Please enter your last name")
                                                        .matches(/^[aA-zZ\s]+$/, "LastName can only consists of alphabets"),
                                        }),
                                        age: Yup.number()
                                                .required("Please enter your age")
                                                .min(1, "Age must be at least 1")
                                                .max(130, "Age cannot be greater than 130"),
                                        address: Yup.string()
                                                    .required("Please enter your address"),
                                    })}

                                    onSubmit = {(values, {resetForm}) => {
                                        console.log(values)
                                        alert("Your form has been submitted.")
                                        resetForm()
                                    }}
                                >
                                    {({
                                        errors,
                                        handleBlur,
                                        handleChange,
                                        handleSubmit,
                                        isValid,
                                        touched,
                                        values
                                    }) => (
                                        <form autoComplete="off" noValidate onSubmit={handleSubmit}>
                                            <CardContent>
                                                <Grid container spacing={2}>
                                                    {/* For name field */}
                                                    <Grid item md={4} xs={12}>
                                                        <TextField 
                                                            error={Boolean(
                                                            getIn(touched, 'name.firstName') &&
                                                            getIn(errors, 'name.firstName')
                                                            )}
                                                            fullWidth
                                                            required
                                                            helperText={
                                                            getIn(touched, 'name.firstName') &&
                                                            getIn(errors, 'name.firstName')
                                                            }
                                                            label="FirstName"
                                                            name="name.firstName"
                                                            onBlur={handleBlur}
                                                            onChange={handleChange}
                                                            type="text"
                                                            value={values.name.firstName}
                                                            variant="outlined"
                                                            size="small"
                                                        />
                                                    </Grid>
                                                    <Grid item md={4} xs={12}>
                                                        <TextField
                                                        fullWidth
                                                        label="MiddleName"
                                                        name="name.middleName"
                                                        onBlur={handleBlur}
                                                        onChange={handleChange}
                                                        type="text"
                                                        value={values.name.middleName}
                                                        variant="outlined"
                                                        size="small"
                                                        />
                                                    </Grid>
                                                    <Grid item md={4} xs={12}>
                                                        <TextField
                                                        error={Boolean(
                                                        getIn(touched, 'name.lastName') &&
                                                        getIn(errors, 'name.lastName')
                                                        )}
                                                        fullWidth
                                                        required
                                                        helperText={
                                                        getIn(touched, 'name.lastName') &&
                                                        getIn(errors, 'name.lastName')
                                                        }
                                                        label="LastName"
                                                        name="name.lastName"
                                                        onBlur={handleBlur}
                                                        onChange={handleChange}
                                                        type="text"
                                                        value={values.name.lastName}
                                                        variant="outlined"
                                                        size="small"
                                                        />
                                                    </Grid>

                                                    {/* For age field */}
                                                    <Grid item md={3} xs={12}>
                                                        <TextField
                                                        error={Boolean(touched.age && errors.age)}
                                                        fullWidth
                                                        required
                                                        helperText={touched.age && errors.age}
                                                        label="Age"
                                                        name="age"
                                                        onBlur={handleBlur}
                                                        onChange={handleChange}
                                                        type="text"
                                                        value={values.age}
                                                        variant="outlined"
                                                        size="small"
                                                        />
                                                    </Grid>

                                                    {/* For address field */}
                                                    <Grid item md={9} xs={12}>
                                                        <TextField
                                                        error={Boolean(touched.address && errors.address)}
                                                        fullWidth
                                                        required
                                                        helperText={touched.address && errors.address}
                                                        label="Address"
                                                        name="address"
                                                        onBlur={handleBlur}
                                                        onChange={handleChange}
                                                        type="text"
                                                        value={values.address}
                                                        variant="outlined"
                                                        size="small"
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                            <Divider />
                                            <CardActions>
                                                <Button
                                                    color="primary"
                                                    type="submit"
                                                    variant="contained"
                                                >
                                                    Submit
                                                </Button>
                                            </CardActions>
                                        </form>
                                    )}
                                </Formik>
                            </Card>
                        </Grid>
                    </Grid>
                </ThemeProvider>

            </main>
        </div>
    )
}