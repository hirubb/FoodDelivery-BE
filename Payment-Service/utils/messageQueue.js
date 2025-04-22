// utils/messageQueue.js
const amqp = require('amqplib');

let channel = null;

const connectQueue = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    
    // Ensure queues exist
    await channel.assertQueue('order_status_updates', { durable: true });
    await channel.assertQueue('payment_notifications', { durable: true });
    
    console.log('✅ Connected to RabbitMQ');
    return channel;
  } catch (error) {
    console.error('❌ RabbitMQ connection error:', error);
    throw error;
  }
};

const publishToQueue = async (queueName, message) => {
  try {
    if (!channel) await connectQueue();
    
    return channel.sendToQueue(
      queueName,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  } catch (error) {
    console.error(`❌ Failed to publish to queue ${queueName}:`, error);
    throw error;
  }
};

const consumeFromQueue = async (queueName, callback) => {
  try {
    if (!channel) await connectQueue();
    
    await channel.consume(queueName, (message) => {
      const content = JSON.parse(message.content.toString());
      callback(content);
      channel.ack(message);
    });
  } catch (error) {
    console.error(`❌ Failed to consume from queue ${queueName}:`, error);
    throw error;
  }
};

module.exports = {
  connectQueue,
  publishToQueue,
  consumeFromQueue
};