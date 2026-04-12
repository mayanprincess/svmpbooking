/** Item from GET /reservations/mine (backend ReservationOut — fields may grow). */
export type UserReservationMine = {
	id: string | number;
	user_id?: string | null;
	confirmationNumber?: string | null;
	checkIn?: string | null;
	checkOut?: string | null;
	isPaid?: boolean | null;
};
