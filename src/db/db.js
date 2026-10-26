import mongoose from 'mongoose'

// Cluster "saas" (o mesmo do Manage System), banco "marketingsell".
const db = async () => {
    await mongoose.connect(`mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@saas.du44abf.mongodb.net/marketingsell?retryWrites=true&w=majority`)
    console.log('Conectado ao MongoDB')
}

export default db
