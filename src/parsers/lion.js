async function parseLion(resi, verify) {
  // Placeholder for Lion Parcel tracking parser
  return {
    courier: 'Lion Parcel',
    resi: resi,
    status: 'ON PROCESS',
    service: 'REGPACK',
    sender: {
      name: 'SENDER LION',
      city: 'MEDAN'
    },
    receiver: {
      name: 'RECEIVER LION',
      city: 'BANDUNG',
      relationship: '-'
    },
    info: {
      date: '28-06-2026 09:00:00',
      weight: '2 Kg',
      quantity: 1,
      description: 'Clothing',
      podDate: '-'
    },
    history: [
      {
        date: '28-06-2026 14:00:00',
        description: 'Arrived at Bandung Transit Hub',
        isCurrent: true
      },
      {
        date: '28-06-2026 09:00:00',
        description: 'Shipment received by Lion Parcel agent',
        isCurrent: false
      }
    ]
  };
}

module.exports = {
  parseLion
};
